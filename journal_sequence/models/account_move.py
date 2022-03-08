from odoo import models, fields, api
from odoo.exceptions import UserError

import logging
_logger = logging.getLogger(__name__)


class AccountMove(models.Model):
    _inherit = 'account.move'

    sequence_generated = fields.Boolean(string="Sequence Generated", copy=False)

    @api.depends('posted_before', 'state', 'journal_id', 'date')
    def _compute_name(self):
        for move in self:
            if not move.journal_id.sequence_id:
              return super(AccountMove, self)._compute_name()
            _logger.warning(' move._get_sequence')
            sequence_id = move._get_sequence2()
            if not sequence_id:
                raise UserError('Please define a sequence on your journal: %s.' % move.journal_id.name)
            if not move.sequence_generated and move.state == 'draft':
                move.name = '/'
            elif not move.sequence_generated and move.state != 'draft':
                move.name = sequence_id.with_context({'ir_sequence_date': move.invoice_date, 'bypass_constrains': True}).next_by_id(sequence_date=move.invoice_date)
                move.sequence_generated = True

    def _get_sequence2(self):
        ''' Return the sequence to be used during the post of the current move.
        :return: An ir.sequence record or False.
        '''
        self.ensure_one()

        _logger.warning(2929)
        _logger.warning(self.move_type)
        journal = self.journal_id
        _logger.warning(journal.refund_sequence_id)
        _logger.warning(journal)
        _logger.warning(journal.name)


        if self.move_type in ('entry', 'out_invoice', 'in_invoice', 'out_receipt', 'in_receipt') or not journal.refund_sequence:
            return journal.sequence_id
        if not journal.refund_sequence_id:
            return
        return journal.refund_sequence_id

    # def _get_invoice_computed_reference(self):
    #     self.ensure_one()
    #     if self.journal_id.invoice_reference_type == 'none':
    #         return ''
    #     else:
    #         ref_function = getattr(self, '_get_invoice_reference_{}_{}'.format(self.journal_id.invoice_reference_model, self.journal_id.invoice_reference_type))
    #         if ref_function:
    #             return ref_function()
    #         else:
    #             raise UserError(_('The combination of reference model and reference type on the journal is not implemented'))

