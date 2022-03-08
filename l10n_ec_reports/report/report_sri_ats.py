# -*- coding: utf-8 -*-
#############################################################################
#
#    Jasoft Cía. Ltda.
#
#############################################################################

import time
import logging

from xml.dom import minidom

from lxml import etree

from datetime import datetime
from calendar import monthrange
import math

from odoo import api, models, _
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)


class ReportSriAts(models.AbstractModel):
    _name = 'report.l10n_ec_reports.report_sri_ats'
    _description = 'ARI ATS Report'

    def _lines(self, data, partner):
        full_account = []
        currency = self.env['res.currency']
        query_get_data = self.env['account.move.line'].with_context(
            data['form'].get('used_context', {}))._query_get()
        reconcile_clause = "" if data['form'][
            'reconciled'] else ' AND "account_move_line".full_reconcile_id IS NULL '
        params = [partner.id, tuple(data['computed']['move_state']),
                  tuple(data['computed']['account_ids'])] + \
                 query_get_data[2]
        query = """
            SELECT "account_move_line".id, "account_move_line".date, j.code, acc.code as a_code, acc.name as a_name, "account_move_line".ref, m.name as move_name, "account_move_line".name, "account_move_line".debit, "account_move_line".credit, "account_move_line".amount_currency,"account_move_line".currency_id, c.symbol AS currency_code
            FROM """ + query_get_data[0] + """
            LEFT JOIN account_journal j ON ("account_move_line".journal_id = j.id)
            LEFT JOIN account_account acc ON ("account_move_line".account_id = acc.id)
            LEFT JOIN res_currency c ON ("account_move_line".currency_id=c.id)
            LEFT JOIN account_move m ON (m.id="account_move_line".move_id)
            WHERE "account_move_line".partner_id = %s
                AND m.state IN %s
                AND "account_move_line".account_id IN %s AND """ + \
                query_get_data[1] + reconcile_clause + """
                ORDER BY "account_move_line".date"""
        self.env.cr.execute(query, tuple(params))
        res = self.env.cr.dictfetchall()
        sum = 0.00
        lang_code = self.env.context.get('lang') or 'en_US'
        lang = self.env['res.lang']
        lang_id = lang._lang_get(lang_code)
        date_format = lang_id.date_format
        for r in res:
            r['date'] = r['date']
            r['displayed_name'] = '-'.join(
                r[field_name] for field_name in ('move_name', 'ref', 'name')
                if r[field_name] not in (None, '', '/')
            )
            sum += r['debit'] - r['credit']
            r['progress'] = sum
            r['currency_id'] = currency.browse(r.get('currency_id'))
            full_account.append(r)
        return full_account

    def _sum_partner(self, data, partner, field):
        if field not in ['debit', 'credit', 'debit - credit']:
            return
        result = 0.00
        query_get_data = self.env['account.move.line'].with_context(
            data['form'].get('used_context', {}))._query_get()
        reconcile_clause = "" if data['form'][
            'reconciled'] else ' AND "account_move_line".full_reconcile_id IS NULL '

        params = [partner.id, tuple(data['computed']['move_state']),
                  tuple(data['computed']['account_ids'])] + \
                 query_get_data[2]
        query = """SELECT sum(""" + field + """)
                FROM """ + query_get_data[0] + """, account_move AS m
                WHERE "account_move_line".partner_id = %s
                    AND m.id = "account_move_line".move_id
                    AND m.state IN %s
                    AND account_id IN %s
                    AND """ + query_get_data[1] + reconcile_clause
        self.env.cr.execute(query, tuple(params))

        contemp = self.env.cr.fetchone()
        if contemp is not None:
            result = contemp[0] or 0.00
        return result

    @api.model
    def generate_report(self, ir_report, docids, data=None):
        """
        Generate and validate XML report. Use incoming `ir_report` settings
        to setup encoding and XMl declaration for result `xml`.

        Methods:
         * `_get_rendering_context` `ir.actions.report` - get report variables.
         It will call `_get_report_values` of report's class if it's exist.
         * `render_template` of `ir.actions.report` - get report content
         * `validate_report` - check result content

        Args:
         * ir_report(`ir.actions.report`) - report definition instance in Odoo
         * docids(list) - IDs of instances for those report will be generated
         * data(dict, None) - variables for report rendering

        Returns:
         * str - result content of report
         * str - `"xml"`

        Extra Info:
         * Default encoding is `UTF-8`
        """
        # collect variable for rendering environment
        if not data:
            data = {}
        data.setdefault("report_type", "text")
        data = ir_report._get_rendering_context(docids, data)

        # render template
        result_bin = ir_report._render_template(ir_report.report_name, data)

        # prettify result content
        # normalize indents
        parsed_result_bin = minidom.parseString(result_bin)
        result = parsed_result_bin.toprettyxml(indent=" " * 4)

        # remove empty lines
        utf8 = "UTF-8"
        result = "\n".join(
            line for line in result.splitlines() if line and not line.isspace()
        ).encode(utf8)

        content = etree.tostring(
            etree.fromstring(result),
            encoding=ir_report.xml_encoding or utf8,
            xml_declaration=ir_report.xml_declaration,
            pretty_print=True,
        )

        # validate content
        xsd_schema_doc = ir_report.xsd_schema
        # self.validate_report(xsd_schema_doc, content)
        return content, "xml"

    @api.model
    def _get_report_values(self, docids, data=None):

        def _format_float_sri(amount, precision):
            if amount is None or amount is False:
                return None
            return '%.*f' % (precision, amount)

        if not data.get('form'):
            raise UserError(
                _("Form content is missing, this report cannot be printed."))

        data['computed'] = {}
        if data['form']['period'] == '0106' or data['form']['period'] == '0712':
            if data['form']['period'] == '0106':
                date_until = data['form']['fiscal_year'] + '01'
                date_from = data['form']['fiscal_year'] + '06'
                data['form']['form']['period'] = '06'
            else:
                date_until = data['form']['fiscal_year'] + '07'
                date_from = data['form']['fiscal_year'] + '12'
                data['form']['period'] = '12'
        else:
            date_until = data['form']['fiscal_year'] + data['form']['period']
            date_from = data['form']['fiscal_year'] + data['form']['period']

        in_invoices = self.env['account.move'].search([('move_type', 'in', ['in_invoice']), ('state', 'in', ['posted']),
                                                       ('company_id', '=', data['company_id']),
                                                       ('invoice_date', '>=',
                                                        datetime.strptime(date_from, '%Y%m').strftime('%Y-%m-%d')),
                                                       ('invoice_date', '<=',
                                                        self.last_day_of_month(
                                                            datetime.strptime(date_until, '%Y%m')).strftime(
                                                            '%Y-%m-%d'))])

        in_invoice_lines = []

        for invoice in in_invoices:
            values = {}
            invoice_lines = invoice.invoice_line_ids.filtered(lambda inv: not inv.display_type)
            values['invoice_line_values'] = []
            for line in invoice_lines:
                values['invoice_line_values'].append(self.get_invoice_line_values(invoice, line))

            values['tax_amount'] = {}
            values['tax_amount'].setdefault('base12', {
                'tax_type': '2',  # IVA
                'percent_id': '2',
                'total_base': 0.00,
                'total_value': 0.00
            })
            values['tax_amount'].setdefault('base0', {
                'tax_type': '2',  # IVA
                'percent_id': '0',
                'total_base': 0.00,
                'total_value': 0.00
            })
            for line in values['invoice_line_values']:
                for taxs in line['tax_details']:
                    if taxs['percent_id'] == '0':
                        values['tax_amount']['base0']['total_base'] += taxs['base']
                        values['tax_amount']['base0']['total_value'] += taxs['total']
                    else:
                        values['tax_amount']['base12']['total_base'] += taxs['base']
                        values['tax_amount']['base12']['total_value'] += taxs['total']

            _logger.warning(329)

            values['tax_amount']['base0']['total_value'] = round(values['tax_amount']['base0']['total_value'], 2)
            values['tax_amount']['base0']['total_base'] = round(values['tax_amount']['base0']['total_base'], 2)
            values['tax_amount']['base12']['total_base'] = round(values['tax_amount']['base12']['total_base'], 2)
            values['tax_amount']['base12']['total_value'] = round(values['tax_amount']['base12']['total_value'], 2)

            in_invoice_lines.append({
                'invoice': invoice,
                'tax': values['tax_amount'],
                'id': 2
            })

        print(in_invoice_lines)

        out_invoice_lines = []
        query = """SELECT invb0.partner_id, invb0.name, invb0.vat, invb0.sequence, invb0.num_invoices, round(base0, 2), round(taxes0, 2),
                        round(b12.base, 2) as base12, round(b12.taxes, 2) as taxes12 
                    FROM
                    (
                    SELECT inv.partner_id, inv.name, inv.vat, inv.sequence, inv.num_invoices, b0.base as base0, b0.taxes as taxes0
                    FROM
                    (
                    SELECT acm.partner_id, rep.name, rep.vat, lit.sequence, COUNT(DISTINCT acm.id) num_invoices 
                    FROM account_move acm, res_partner rep, l10n_latam_identification_type lit
                    WHERE acm.partner_id = rep.id
                      AND rep.l10n_latam_identification_type_id = lit.id
                      AND move_type = 'out_invoice'
                      AND state = 'posted'
                      AND acm.company_id = %(company_id)s
                      AND to_char(invoice_date, 'yyyymm') >= %(date_from)s
                      AND to_char(invoice_date, 'yyyymm') <= %(date_until)s
                    GROUP BY acm.partner_id, rep.name, rep.vat, lit.sequence
                    ) inv
                    LEFT JOIN
                    (
                        SELECT am.partner_id, tax.tax_group_id, SUM(price_subtotal) base, 
                                SUM(price_subtotal * tax.amount / 100) as taxes
                        FROM account_move am, 
                             account_move_line aml, 
                             account_move_line_account_tax_rel atr,
                             account_tax tax
                        WHERE aml.id = atr.account_move_line_id
                          AND am.id = aml.move_id
                          AND am.company_id = aml.company_id
                          AND atr.account_tax_id = tax.id
                          AND am.move_type = 'out_invoice'
                          AND state = 'posted'
                          AND tax.tax_group_id = 4
                          AND am.company_id = %(company_id)s
                          AND to_char(invoice_date, 'yyyymm') >= %(date_from)s
                          AND to_char(invoice_date, 'yyyymm') <= %(date_until)s
                        GROUP BY am.partner_id, tax.tax_group_id
                    ) b0
                    ON inv.partner_id = b0.partner_id) invb0
                    LEFT JOIN
                    (
                        SELECT am.partner_id, tax.tax_group_id, COUNT (DISTINCT am.id) num_invoices, 
                                SUM(price_subtotal) base, SUM(price_subtotal * tax.amount / 100) AS taxes
                        FROM account_move am, 
                             account_move_line aml, 
                             account_move_line_account_tax_rel atr,
                             account_tax tax
                        WHERE aml.id = atr.account_move_line_id
                          AND am.id = aml.move_id
                          AND am.company_id = aml.company_id
                          AND atr.account_tax_id = tax.id
                          AND am.move_type = 'out_invoice'
                          AND state = 'posted'
                          AND tax.tax_group_id = 2
                          AND am.company_id = %(company_id)s
                          AND to_char(invoice_date, 'yyyymm') >= %(date_from)s
                          AND to_char(invoice_date, 'yyyymm') <= %(date_until)s
                        GROUP BY am.partner_id, tax.tax_group_id
                    ) b12
                    ON invb0.partner_id = b12.partner_id"""
        self.env.cr.execute(query, {'company_id': data['company_id'], 'date_from': date_from, 'date_until': date_until})
        out_invoices = self.env.cr.fetchall()

        for partner_id, partner_name, partner_vat, partner_vat_code, num_invoices, base0, taxes0, base12, taxes12 in out_invoices:
            sql_query = """SELECT distinct payment_method_code
                            FROM account_move am, account_sri_payment_method spm
                            WHERE am.sri_payment_method = spm.id
                              AND am.move_type = 'out_invoice'
                              AND am.state = 'posted'
                              AND am.company_id = %(company_id)s
                              AND to_char(invoice_date, 'yyyymm') >= %(date_from)s
                              AND to_char(invoice_date, 'yyyymm') <= %(date_until)s
                              and am.partner_id = %(partner_id)s"""
            self.env.cr.execute(sql_query,
                                {'company_id': data['company_id'], 'partner_id': partner_id, 'date_from': date_from,
                                 'date_until': date_until})
            payments_code = self.env.cr.fetchall()
            print(payments_code)
            payments = [{'code': r[0]} for r in payments_code]

            move = {
                'partner_id': partner_id,
                'partner_name': partner_name,
                'partner_vat': partner_vat,
                'partner_vat_code': partner_vat_code,
                'num_invoices': num_invoices,
                'base0': base0 if base0 is not None else 0.00,
                'taxes0': taxes0 if taxes0 is not None else 0.00,
                'base12': base12 if base12 is not None else 0.00,
                'taxes12': taxes12 if taxes12 is not None else 0.00,
                'payment_methods': payments
            }
            # print(move)
            out_invoice_lines.append(move)

        print(out_invoice_lines)

        sql_total = """SELECT sum(amount_untaxed) total
                        FROM account_move am
                        WHERE am.move_type = 'out_invoice'
                          AND am.state = 'posted'
                          AND am.company_id = %(company_id)s
                          AND to_char(invoice_date, 'yyyymm') >= %(date_from)s
                          AND to_char(invoice_date, 'yyyymm') <= %(date_until)s"""

        self.env.cr.execute(sql_total,
                            {'company_id': data['company_id'], 'date_from': date_from,
                             'date_until': date_until})
        total_ventas = self.env.cr.fetchone()
        print(total_ventas[0])

        doc = {
            'data': data['form'],
            'in_invoices': in_invoice_lines,
            'out_invoices': out_invoice_lines,
            'time': time,
            'lines': self._lines,
            'sum_partner': self._sum_partner,
            'total_ventas': total_ventas,
            'format_float': _format_float_sri,
        }
        print(doc)
        return doc

    def get_invoice_line_values(self, invoice, line):
        values = {'line': line}

        # ==== Amounts ====

        values['price_unit_wo_discount'] = line.price_unit * (1 - (line.discount / 100.00))
        values['total_wo_discount'] = invoice.currency_id.round(line.price_unit * line.quantity)
        values['discount_amount'] = invoice.currency_id.round(values['total_wo_discount'] - line.price_subtotal)
        values['subtotal_with_discount'] = invoice.currency_id.round(
            values['total_wo_discount'] - values['discount_amount'])

        try:
            values['price_subtotal_unit'] = invoice.currency_id.round(values['total_wo_discount'] / line.quantity)
        except Exception as e:
            values['price_subtotal_unit'] = 0

        # ==== Taxes ====

        tax_details = line.tax_ids.compute_all(
            values['price_unit_wo_discount'],
            currency=line.currency_id,
            quantity=line.quantity,
            product=line.product_id,
            partner=line.partner_id,
            is_refund=invoice.move_type in ('out_refund', 'in_refund'),
        )

        values['tax_details'] = {}
        print('taxes')
        print(tax_details['taxes'])
        for tax_res in tax_details['taxes']:
            tax = self.env['account.tax'].browse(tax_res['id'])

            values['tax_details'].setdefault(tax, {
                'tax': tax,
                'base': round(tax_res['base'], 2),
                'tax_type': '2',  # IVA
                'tax_amount': tax.amount,
                'percent_id': '0' if tax.amount == 0 else '2',
                'total': 0.00,
            })

            values['tax_details'][tax]['total'] += tax_res['amount']
            # _logger.warning(values['tax_details'])

        values['tax_details'] = list(values['tax_details'].values())

        return values

    def last_day_of_month(self, date_value):
        return date_value.replace(day=monthrange(date_value.year, date_value.month)[1])

    def truncate(self, number, decimals=0):
        """
        Returns a value truncated to a specific number of decimal places.
        """
        if not isinstance(decimals, int):
            raise TypeError("decimal places must be an integer.")
        elif decimals < 0:
            raise ValueError("decimal places has to be 0 or more.")
        elif decimals == 0:
            return math.trunc(number)

        factor = 10.0 ** decimals
        return math.trunc(number * factor) / factor
