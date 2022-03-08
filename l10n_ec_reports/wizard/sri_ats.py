# -*- coding: utf-8 -*-
#############################################################################
#
#    Jasoft Cía. Ltda.
#
#############################################################################

from odoo import api, fields, models, _
from odoo.tools.misc import get_lang

import datetime

class AccountSRIATSReport(models.TransientModel):
    _name = 'account.report.sri_ats'
    _description = 'SRI ATS Report'

    company_id = fields.Many2one('res.company', string='Company', required=True, default=lambda self: self.env.company)
    date_from = fields.Date(string='Start Date')
    date_to = fields.Date(string='End Date')
    target_move = fields.Selection([('posted', 'All Posted Entries'),
                                    ('all', 'All Entries'),
                                    ], string='Target Moves', required=True, default='posted')
    include_invoices = fields.Boolean(string='Incluir facturas electónicas')

    @api.model
    def _get_periods(self):
        lst = []
        lst.append(('01', 'Enero'))
        lst.append(('02', 'Febrero'))
        lst.append(('03', 'Marzo'))
        lst.append(('04', 'Abril'))
        lst.append(('05', 'Mayo'))
        lst.append(('06', 'Junio'))
        lst.append(('0106', 'Primer semestre (Enero - Junio)'))
        lst.append(('07', 'Julio'))
        lst.append(('08', 'Agosto'))
        lst.append(('09', 'Septiembre'))
        lst.append(('10', 'Octubre'))
        lst.append(('11', 'Noviembre'))
        lst.append(('12', 'Diciembre'))
        lst.append(('0712', 'Segundo semestre (Julio - Diciembre)'))
        return lst

    @api.model
    def _get_years(self):
        now = datetime.datetime.now()
        lst = []
        for i in range(2021, now.year+1):
            lst.append((i, i))
        return lst

    def _get_default_period(self):
        now = datetime.datetime.now()
        print(now.year, now.month, now.day, now.hour, now.minute, now.second)
        print('%02d' % now.month)
        return '%02d' % now.month

    def _get_default_year(self):
        now = datetime.datetime.now()
        return now.year

    period = fields.Selection(_get_periods, 'Periodo', required=True, default=_get_default_period)

    fiscal_year = fields.Selection(_get_years, 'Año fiscal', required=True, default=_get_default_year)

    def _build_contexts(self, data):
        result = {}
        result['company_id'] = data['form']['company_id'][0] or False
        return result

    def check_report(self):
        self.ensure_one()
        data = {}
        data['ids'] = self.env.context.get('active_ids', [])
        data['model'] = self.env.context.get('active_model', 'ir.ui.menu')
        data['form'] = self.read(['fiscal_year', 'period', 'include_invoices'])[0]
        data['company_id'] = self.company_id.id
        #used_context = self._build_contexts(data)
        print(data)
        #print(used_context)
        #data['form']['used_context'] = dict(used_context, lang=get_lang(self.env).code)
        #print(data)
        return self.with_context(discard_logo_check=True)._print_report(data)

    def _print_report(self, data):
        #data = self.pre_print_report(data)
        print(data)
        records = self.env[data['model']].browse(data.get('ids', []))
        print(records)

        #sri_xml = self.env.ref('l10n_ec_reports.report_sri_ats')._render(data)
        #print(sri_xml)

        datas = {
            'ids': [],
            'company_id': self.company_id.id
        }

        return self.env.ref(
            'l10n_ec_reports.action_report_sri_ats').report_action(
            self, data=data)
