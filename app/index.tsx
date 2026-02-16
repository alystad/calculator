import React, { useState } from 'react';
import { SafeAreaView, View, Text, Pressable, StyleSheet } from 'react-native';

type Operator = '+' | '-' | '×' | '÷';

const OPERATOR_SET = new Set<Operator>(['+', '-', '×', '÷']);

const BUTTONS: string[] = [
  'C',
  '⌫',
  '÷',
  '×',
  '7',
  '8',
  '9',
  '-',
  '4',
  '5',
  '6',
  '+',
  '1',
  '2',
  '3',
  '=',
  '0',
  '.',
];

const isDisplayOperator = (value: string): value is Operator => OPERATOR_SET.has(value as Operator);

const normalizeExpression = (expression: string): string => expression.replace(/×/g, '*').replace(/÷/g, '/');

const formatNumber = (value: number): string => {
  if (!Number.isFinite(value)) {
    throw new Error('Invalid number');
  }

  const rounded = Number(value.toFixed(10));
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
};

const evaluateExpression = (rawExpression: string): string => {
  const expression = normalizeExpression(rawExpression).trim();

  if (!expression) {
    return '0';
  }

  const tokens: string[] = [];
  let current = '';

  for (let i = 0; i < expression.length; i += 1) {
    const char = expression[i];
    const isOperator = char === '+' || char === '-' || char === '*' || char === '/';

    if (char === ' ') {
      continue;
    }

    if (isOperator) {
      const previous = expression[i - 1];
      const prevIsOperator = previous === '+' || previous === '-' || previous === '*' || previous === '/';

      if (char === '-' && (i === 0 || prevIsOperator)) {
        current += char;
        continue;
      }

      if (!current) {
        throw new Error('Invalid expression');
      }

      tokens.push(current);
      tokens.push(char);
      current = '';
      continue;
    }

    if ((char >= '0' && char <= '9') || char === '.') {
      current += char;
      continue;
    }

    throw new Error('Invalid character');
  }

  if (current) {
    tokens.push(current);
  }

  if (tokens.length === 0) {
    return '0';
  }

  if (tokens.length % 2 === 0) {
    throw new Error('Invalid expression');
  }

  const numbers: number[] = [];
  const operators: string[] = [];

  for (let i = 0; i < tokens.length; i += 1) {
    if (i % 2 === 0) {
      const parsed = Number(tokens[i]);
      if (Number.isNaN(parsed)) {
        throw new Error('Invalid number');
      }
      numbers.push(parsed);
    } else {
      operators.push(tokens[i]);
    }
  }

  let value = numbers[0];
  const reducedNumbers: number[] = [value];
  const reducedOperators: string[] = [];

  for (let i = 0; i < operators.length; i += 1) {
    const operator = operators[i];
    const nextNumber = numbers[i + 1];

    if (operator === '*' || operator === '/') {
      if (operator === '/' && nextNumber === 0) {
        throw new Error('Divide by zero');
      }
      value = operator === '*' ? value * nextNumber : value / nextNumber;
      reducedNumbers[reducedNumbers.length - 1] = value;
    } else {
      value = nextNumber;
      reducedNumbers.push(nextNumber);
      reducedOperators.push(operator);
    }
  }

  let result = reducedNumbers[0];

  for (let i = 0; i < reducedOperators.length; i += 1) {
    const operator = reducedOperators[i];
    const nextNumber = reducedNumbers[i + 1];
    result = operator === '+' ? result + nextNumber : result - nextNumber;
  }

  return formatNumber(result);
};

export default function CalculatorScreen() {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('0');

  const clearAll = () => {
    setExpression('');
    setResult('0');
  };

  const backspace = () => {
    if (!expression) {
      setResult('0');
      return;
    }

    const nextExpression = expression.slice(0, -1);
    setExpression(nextExpression);
    setResult(nextExpression || '0');
  };

  const currentOperand = (exp: string): string => {
    const lastPlus = exp.lastIndexOf('+');
    const lastMinus = exp.lastIndexOf('-');
    const lastMultiply = exp.lastIndexOf('×');
    const lastDivide = exp.lastIndexOf('÷');
    const lastOperatorIndex = Math.max(lastPlus, lastMinus, lastMultiply, lastDivide);
    return exp.slice(lastOperatorIndex + 1);
  };

  const appendValue = (value: string) => {
    let nextExpression = expression;

    if (result === 'Error' && (value === '.' || (value >= '0' && value <= '9') || value === '-')) {
      nextExpression = '';
    }

    if (value === '.') {
      const operand = currentOperand(nextExpression);
      if (operand.includes('.')) {
        return;
      }
      if (!operand || operand === '-') {
        nextExpression += '0.';
      } else {
        nextExpression += '.';
      }
      setExpression(nextExpression);
      setResult(nextExpression);
      return;
    }

    if (isDisplayOperator(value)) {
      if (!nextExpression) {
        if (value === '-') {
          setExpression('-');
          setResult('-');
        }
        return;
      }

      const lastChar = nextExpression[nextExpression.length - 1];
      if (isDisplayOperator(lastChar)) {
        if (value === '-' && nextExpression.length === 1 && nextExpression === '-') {
          return;
        }
        nextExpression = `${nextExpression.slice(0, -1)}${value}`;
      } else {
        nextExpression += value;
      }

      setExpression(nextExpression);
      setResult(nextExpression);
      return;
    }

    nextExpression += value;
    setExpression(nextExpression);
    setResult(nextExpression);
  };

  const handleEvaluate = () => {
    if (!expression) {
      setResult('0');
      return;
    }

    const lastChar = expression[expression.length - 1];
    if (isDisplayOperator(lastChar)) {
      setResult('Error');
      return;
    }

    try {
      const evaluated = evaluateExpression(expression);
      setExpression(evaluated);
      setResult(evaluated);
    } catch {
      setResult('Error');
    }
  };

  const onPressButton = (button: string) => {
    if (button === 'C') {
      clearAll();
      return;
    }

    if (button === '⌫') {
      backspace();
      return;
    }

    if (button === '=') {
      handleEvaluate();
      return;
    }

    appendValue(button);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.display}>
          <Text style={styles.expressionText} numberOfLines={1}>
            {expression || '0'}
          </Text>
          <Text style={styles.resultText} numberOfLines={1}>
            {result}
          </Text>
        </View>

        <View style={styles.keypad}>
          {BUTTONS.map((button) => {
            const isOperator = isDisplayOperator(button);
            const isAction = button === 'C' || button === '⌫';
            const isEquals = button === '=';
            const isWide = button === '0';

            return (
              <Pressable
                key={button}
                onPress={() => onPressButton(button)}
                style={({ pressed }) => [
                  styles.button,
                  isWide && styles.wideButton,
                  isOperator && styles.operatorButton,
                  isAction && styles.actionButton,
                  isEquals && styles.equalsButton,
                  pressed && styles.buttonPressed,
                ]}
              >
                <Text style={[styles.buttonText, isEquals && styles.equalsButtonText]}>{button}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  display: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  expressionText: {
    color: '#94a3b8',
    fontSize: 24,
  },
  resultText: {
    color: '#e2e8f0',
    fontSize: 48,
    fontWeight: '700',
    marginTop: 8,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  button: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wideButton: {
    width: '48%',
    aspectRatio: 2.15,
    alignItems: 'flex-start',
    paddingLeft: 28,
  },
  operatorButton: {
    backgroundColor: '#334155',
  },
  actionButton: {
    backgroundColor: '#475569',
  },
  equalsButton: {
    backgroundColor: '#f97316',
  },
  equalsButtonText: {
    color: '#ffffff',
  },
  buttonText: {
    color: '#e2e8f0',
    fontSize: 30,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.6,
  },
});
