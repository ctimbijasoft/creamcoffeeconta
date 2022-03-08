from odoo import models, _
from stdnum.ec import ci, ruc
from odoo.exceptions import ValidationError

class ResPartner(models.Model):
    _inherit = 'res.partner'

    def create_from_ui(self, partner):
        print('create_from_ui')
        self.check_vat_ec(self, partner.vat)
        return super(ResPartner, self).create_from_ui()