from odoo import fields, models, api


class PosPaymentMethod(models.Model):
    _inherit = 'pos.payment.method'
    sri_payment_method = fields.Many2one('account.sri.payment.method', string='Forma de Pago', ondelete='set null')
