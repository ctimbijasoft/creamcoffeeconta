# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import fields, models


class RestaurantPrinter(models.Model):
    _inherit = 'restaurant.printer'

    printer_type = fields.Selection(selection_add=[('printer_service', 'Use a Printer Service')])
    printer_url_service = fields.Char(string='Printer Service URL',
                                      help="Example: ws://localhost:8786/jasoft/printer")
    kitchen_printer = fields.Boolean(string='Is Kitchen Printer', default=False)
