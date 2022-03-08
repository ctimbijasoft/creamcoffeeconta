# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
{
    'name': 'Ecuadorian Reports by Jasoft',
    'version': '1.0.1',
    'description': '''
Functional
----------

This module adds accounting features for Ecuadorian localization, which
represent the minimun requirements to operate a business in Ecuador in compliance
with local regulation bodies such as the ecuadorian tax authority -SRI- and the 
Superintendency of Companies -Super Intendencia de Compañías-

Follow the next configuration steps:
1. Go to your company and configure your country as Ecuador

Technical
---------
Master Data:
* SRI ATS

Authors:
    Ing. Andres Calle <andres.calle@trescloud.com>
    Ing. José Miguel Rivero <jose.rivero@trescloud.com>
    ''',
    'author': 'Jasoft',
    'category': 'Localization',
    'maintainer': 'Jasoft CIA. LTDA.',
    'website': 'http://www1.jasoft.com',
    'license': 'OEEL-1',
    'depends': [
        'account',
    ],   
    'data': [
        'security/ir.model.access.csv',
        'views/reports_menu.xml',
        'wizard/sri_ats.xml',
        'report/report_sri_ats.xml',
        'report/report.xml',
    ],
    'license': 'LGPL-3',
    'installable': True,
    'auto_install': False,
    'application': True,
}
