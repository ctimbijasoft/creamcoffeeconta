from odoo import fields, models, api
import pytz


class PosOrder(models.Model):
    _inherit = 'pos.order'

    pos_voucher_ref = fields.Char(string='Voucher Number', readonly=False)
    is_electronic_payment = fields.Boolean(string='Electronic Payment', readonly=False)
    access_key = fields.Char(string='Clave Acceso', readonly=False)
    num_invoice = fields.Char(string='Num Factura', readonly=False)

    def _prepare_invoice_vals(self):
        self.ensure_one()
        timezone = pytz.timezone(self._context.get('tz') or self.env.user.tz or 'UTC')
        vals = {
            'payment_reference': self.name,
            'invoice_origin': self.name,
            'journal_id': self.session_id.config_id.invoice_journal_id.id,
            'move_type': 'out_invoice' if self.amount_total >= 0 else 'out_refund',
            'ref': self.name,
            'partner_id': self.partner_id.id,
            'narration': self.note or '',
            # considering partner's sale pricelist's currency
            'currency_id': self.pricelist_id.currency_id.id,
            'invoice_user_id': self.user_id.id,
            'invoice_date': self.date_order.astimezone(timezone).date(),
            'fiscal_position_id': self.fiscal_position_id.id,
            'invoice_line_ids': [(0, None, self._prepare_invoice_line(line)) for line in self.lines],
            'invoice_cash_rounding_id': self.config_id.rounding_method.id
            if self.config_id.cash_rounding and (not self.config_id.only_round_cash_method or any(
                p.payment_method_id.is_cash_count for p in self.payment_ids))
            else False,
            'printer_point': self.config_id.printer_point.id,
            'sri_payment_method': self.payment_ids[0].payment_method_id.sri_payment_method.id,
        }
        return vals

    @api.model
    def _order_fields(self, ui_order):
        order_fields = super(PosOrder, self)._order_fields(ui_order)
        order_fields['pos_voucher_ref'] = ui_order.get('pos_voucher_ref', "")
        order_fields['is_electronic_payment'] = ui_order.get('is_electronic_payment', False)
        order_fields['access_key'] = ui_order.get('access_key', "")
        order_fields['num_invoice'] = ui_order.get('num_invoice', "")
        return order_fields
