from odoo import fields, models, api


class PosConfig(models.Model):
    _inherit = 'pos.config'
    printer_point = fields.Many2one('account.printer.point', string='Printer Point', ondelete='set null')
    is_to_invoice = fields.Boolean(string='Is Invoice', default=True)
    partner_id = fields.Many2one('res.partner', tracking=True, check_company=True, string='Partner',
                                 change_default=True)
    open_amount_locked = fields.Boolean(string='Cantidad de apertura bloqueda', default=False)
    open_cashbox_auto = fields.Boolean(string='Abrir caja automaticamente', default=False)

    mrp_picking_type_id = fields.Many2one(
        'stock.picking.type',
        string='Operation Type',
        required=True,
        domain="[('code', '=', 'outgoing'), ('warehouse_id.company_id', '=', company_id)]",
        ondelete='restrict')
