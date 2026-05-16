'use client';

import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Typography,
  Box,
  SelectChangeEvent,
  Modal,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useTranslation } from '../hooks/useTranslation';
import {
  Transaction,
  TransactionType,
  ExpenseClassification,
  IncomeClassification,
  Regularity,
} from '../types';
import { useStore } from '../store/useStore';
import {
  suggestFromConcept,
  expenseClassificationLabels,
  incomeClassificationLabels,
  regularityLabels,
} from '../utils/classifySuggestion';

const iosButtonStyle = {
  borderRadius: 3,
  textTransform: 'none' as const,
  fontWeight: 600,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, rgba(255, 255, 255, 0.1) 100%)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.3)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.1)',
  color: 'rgba(0, 0, 0, 0.8)',
  '&:hover': {
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.2) 100%)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-1px)',
  },
  '&:active': {
    transform: 'translateY(0px)',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1), 0 1px 4px rgba(0, 0, 0, 0.1)',
  },
};

interface ModalTransactionState {
  id?: string;
  date: string;
  amount: string;
  type: TransactionType;
  concept: string;
  classification: ExpenseClassification | IncomeClassification;
  regularity: Regularity;
  notes?: string;
}

interface TransactionModalProps {
  open: boolean;
  onClose: () => void;
  transaction: Omit<Transaction, 'id'> | Transaction | null;
  showSnackbar: (message: string, severity: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function TransactionModal({
  open,
  onClose,
  transaction: initialTransaction,
  showSnackbar,
}: TransactionModalProps) {
  const { addTransaction, updateTransaction } = useStore();
  const [transaction, setTransaction] = useState<ModalTransactionState | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;

    if (initialTransaction) {
      const existing = initialTransaction as Transaction;
      const type = existing.type;
      // Handle old-format transactions that have category but no concept
      const concept = existing.concept ?? existing.category?.name ?? '';
      const suggested = suggestFromConcept(concept, type);
      setTransaction({
        ...(existing.id ? { id: existing.id } : {}),
        date: existing.date,
        amount: String(existing.amount),
        type,
        concept,
        classification: existing.classification ?? suggested.classification,
        regularity: existing.regularity ?? suggested.regularity,
        notes: existing.notes ?? '',
      });
    } else {
      setTransaction({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        type: 'expense',
        concept: '',
        classification: 'otro',
        regularity: 'no_regular',
        notes: '',
      });
    }
  }, [open, initialTransaction]);

  const handleTypeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newType: TransactionType | null
  ) => {
    if (!newType || !transaction) return;
    const suggested = suggestFromConcept(transaction.concept, newType);
    setTransaction(prev =>
      prev
        ? { ...prev, type: newType, classification: suggested.classification, regularity: suggested.regularity }
        : null
    );
  };

  const handleConceptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const concept = e.target.value;
    setTransaction(prev => {
      if (!prev) return null;
      const suggested = suggestFromConcept(concept, prev.type);
      return { ...prev, concept, classification: suggested.classification, regularity: suggested.regularity };
    });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setTransaction(prev => prev ? { ...prev, amount: value } : null);
    }
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    setTransaction(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTransaction(prev => prev ? { ...prev, date: e.target.value } : null);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTransaction(prev => prev ? { ...prev, notes: e.target.value } : null);
  };

  const handleSave = () => {
    if (!transaction) return;

    if (!transaction.concept.trim()) {
      showSnackbar('El concepto es requerido', 'error');
      return;
    }
    const amountAsNumber = parseFloat(transaction.amount);
    if (isNaN(amountAsNumber) || amountAsNumber <= 0) {
      showSnackbar('Ingresa un monto válido', 'error');
      return;
    }

    const transactionToSave: Transaction = {
      id: transaction.id ?? uuidv4(),
      date: transaction.date,
      amount: amountAsNumber,
      type: transaction.type,
      concept: transaction.concept.trim(),
      classification: transaction.classification,
      regularity: transaction.regularity,
      notes: transaction.notes,
      // Synthetic legacy field so transactions/page.tsx (not yet updated) doesn't break
      category: { id: 'legacy', name: transaction.concept.trim(), type: transaction.type },
    };

    if (transaction.id) {
      updateTransaction(transactionToSave);
      showSnackbar(t.transaction_updated_successfully, 'success');
    } else {
      addTransaction(transactionToSave);
      showSnackbar(t.transaction_added_successfully, 'success');
    }
    onClose();
  };

  if (!transaction) return null;

  const classificationOptions =
    transaction.type === 'expense'
      ? Object.entries(expenseClassificationLabels)
      : Object.entries(incomeClassificationLabels);

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="transaction-modal-title"
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          backdropFilter: 'blur(4px)',
        },
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.4)',
          borderRadius: 2,
          p: 4,
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.05) 100%)',
            pointerEvents: 'none',
            zIndex: -1,
            borderRadius: 'inherit',
          },
        }}
      >
        <Typography id="transaction-modal-title" variant="h6" component="h2" gutterBottom>
          {transaction.id ? t.edit_transaction : t.add_new_transaction}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Tipo */}
          <ToggleButtonGroup
            value={transaction.type}
            exclusive
            onChange={handleTypeChange}
            fullWidth
            size="small"
          >
            <ToggleButton value="expense" sx={{ fontWeight: 600 }}>
              Gasto
            </ToggleButton>
            <ToggleButton value="income" sx={{ fontWeight: 600 }}>
              Ingreso
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Concepto */}
          <TextField
            fullWidth
            label="Concepto"
            placeholder="café, renta, gasolina..."
            value={transaction.concept}
            onChange={handleConceptChange}
            autoFocus
          />

          {/* Clasificación — sugerida automáticamente, editable */}
          <FormControl fullWidth>
            <InputLabel>Clasificación</InputLabel>
            <Select
              name="classification"
              value={transaction.classification}
              onChange={handleSelectChange}
              label="Clasificación"
            >
              {classificationOptions.map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Regularidad — sugerida según clasificación, editable */}
          <FormControl fullWidth>
            <InputLabel>Regularidad</InputLabel>
            <Select
              name="regularity"
              value={transaction.regularity}
              onChange={handleSelectChange}
              label="Regularidad"
            >
              {Object.entries(regularityLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Monto */}
          <TextField
            fullWidth
            type="text"
            label={t.amount}
            placeholder="0"
            value={transaction.amount}
            onChange={handleAmountChange}
          />

          {/* Fecha */}
          <TextField
            fullWidth
            type="date"
            label={t.date}
            value={transaction.date}
            onChange={handleDateChange}
            InputLabelProps={{ shrink: true }}
          />

          {/* Notas (opcional) */}
          <TextField
            fullWidth
            multiline
            rows={3}
            label={t.notes}
            placeholder={t.notes}
            value={transaction.notes || ''}
            onChange={handleNotesChange}
            variant="outlined"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
                '&.Mui-focused': { backgroundColor: 'rgba(255, 255, 255, 0.1)' },
              },
            }}
          />

          <Button variant="contained" onClick={handleSave} sx={iosButtonStyle}>
            {transaction.id ? t.update_transaction : t.add_transaction}
          </Button>
          <Button variant="outlined" onClick={onClose} sx={iosButtonStyle}>
            {t.cancel}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
