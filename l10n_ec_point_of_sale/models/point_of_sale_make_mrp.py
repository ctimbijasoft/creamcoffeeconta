# -*- coding: utf-8 -*-
##############################################################################
#
#    Jasoft Cía. Ltd.
#
##############################################################################

from odoo import models, fields, api
from odoo.exceptions import Warning


class MrpProduction(models.Model):
    _inherit = 'mrp.production'

    def create_mrp_from_pos(self, products):
        print('create_mrp_from_pos')
        product_ids = []
        if products:
            for product in products:
                flag = 1
                if product_ids:
                    for product_id in product_ids:
                        if product_id['id'] == product['id']:
                            product_id['qty'] += product['qty']
                            flag = 0
                if flag:
                    product_ids.append(product)
            for prod in product_ids:
                print(prod)
                if prod['qty'] > 0:
                    product = self.env['product.product'].search([('id', '=', prod['id'])])
                    mrp_picking_type_id = self.env['stock.picking.type'].search([('id', '=', prod['mrp_picking_type_id'])])
                    bom_count = self.env['mrp.bom'].search([('product_tmpl_id', '=', prod['product_tmpl_id'])])
                    if bom_count:
                        bom_temp = self.env['mrp.bom'].search([('product_tmpl_id', '=', prod['product_tmpl_id']),
                                                               ('product_id', '=', False)])
                        bom_prod = self.env['mrp.bom'].search([('product_id', '=', prod['id'])])
                        if bom_prod:
                            bom = bom_prod[0]
                        elif bom_temp:
                            bom = bom_temp[0]
                        else:
                            bom = []
                        if bom:
                            vals = {
                                'origin': 'POS-' + prod['pos_reference'],
                                'state': 'confirmed',
                                'product_id': prod['id'],
                                'product_tmpl_id': prod['product_tmpl_id'],
                                'product_uom_id': prod['uom_id'],
                                'product_qty': prod['qty'],
                                'location_dest_id': mrp_picking_type_id.default_location_dest_id.id,
                                # 'location_id': location_dest,
                                'picking_type_id': mrp_picking_type_id.id,
                                'location_src_id': mrp_picking_type_id.default_location_src_id.id,
                                'bom_id': bom.id,
                            }
                            print(51)
                            print(vals)
                            mrp_order = self.sudo().create(vals)
                            print(54)
                            print(vals)
                            print(mrp_order)
                            list_value = []
                            for bom_line in mrp_order.bom_id.bom_line_ids:
                                try:
                                    #location_dest = bom_line.product_id.with_context(force_company=mrp_order.company_id.id).property_stock_production.id
                                    #print(location_dest)
                                    print(mrp_order.location_src_id.id)
                                    print(mrp_order)
                                    list_value.append((0, 0, {
                                        'raw_material_production_id': mrp_order.id,
                                        'name': mrp_order.name,
                                        'product_id': bom_line.product_id.id,
                                        'product_uom': bom_line.product_uom_id.id,
                                        'product_uom_qty': bom_line.product_qty * mrp_order.product_qty,
                                        'picking_type_id': mrp_order.picking_type_id.id,

                                        #'location_id': mrp_order.location_src_id.id,
                                        'location_id': mrp_order.picking_type_id.default_location_src_id.id,
                                        'location_dest_id': mrp_order.picking_type_id.default_location_dest_id.id,
                                        #'location_src_id': mrp_order.picking_type_id.default_location_src_id.id,
                                        'company_id': mrp_order.company_id.id,
                                    }))
                                except Exception as e:
                                    print("error")


                            list_value_finished = [(0, 0, {

                                'production_id': mrp_order.id,
                                'name': mrp_order.name,
                                'raw_material_production_id': 0,
                                'product_id': prod['id'],
                                'product_uom': prod['uom_id'],
                                'product_uom_qty': mrp_order.product_qty,
                                'picking_type_id': mrp_order.picking_type_id.id,
                                #'location_dest_id': mrp_order.location_src_id.id,
                                'location_dest_id': mrp_order.picking_type_id.default_location_dest_id.id,
                                #'location_id': location_dest,
                                'location_id': mrp_order.picking_type_id.default_location_src_id.id,
                                'company_id': mrp_order.company_id.id,
                            })]

                            print(list_value)

                            mrp_order.update({'move_raw_ids': list_value})

                            mrp_order.update({'move_finished_ids': list_value_finished})

                            print(list_value)
                            print(list_value_finished)

                            mrp_order.action_confirm()
                            #mrp_order.product_qty = prod['qty']
                            #mrp_order.qty_producing = prod['qty']
                            mrp_order.update({'qty_producing': prod['qty']})
                            mrp_order._onchange_producing()
                            print(mrp_order.product_qty)
                            mrp_order.button_mark_done()
        return True


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    to_make_mrp = fields.Boolean(string='To Create MRP Order',
                                 help="Check if the product should be make mrp order")

    @api.onchange('to_make_mrp')
    def onchange_to_make_mrp(self):
        if self.to_make_mrp:
            if not self.bom_count:
                raise Warning('Please set Bill of Material for this product.')


class ProductProduct(models.Model):
    _inherit = 'product.product'

    @api.onchange('to_make_mrp')
    def onchange_to_make_mrp(self):
        if self.to_make_mrp:
            if not self.bom_count:
                raise Warning('Please set Bill of Material for this product.')
