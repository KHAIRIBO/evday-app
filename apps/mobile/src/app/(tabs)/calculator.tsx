import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { IconClock, IconDelete } from '@/components/icon';
import { CalcKey } from '@/components/ui/calc-key';
import { IconButton } from '@/components/ui/icon-button';
import { Colors, Fonts, Spacing } from '@/constants/theme';

type Op = '+' | '−' | '×' | '÷';

function format(n: number) {
  if (!isFinite(n)) return 'Error';
  const rounded = Math.round(n * 1e10) / 1e10;
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 10 });
}

function apply(a: number, b: number, op: Op) {
  switch (op) {
    case '+':
      return a + b;
    case '−':
      return a - b;
    case '×':
      return a * b;
    case '÷':
      return b === 0 ? NaN : a / b;
  }
}

export default function CalculatorScreen() {
  const [current, setCurrent] = useState('0');
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<Op | null>(null);
  const [expr, setExpr] = useState('');
  const [freshEntry, setFreshEntry] = useState(true);

  function pressDigit(d: string) {
    if (freshEntry) {
      setCurrent(d === '.' ? '0.' : d);
      setFreshEntry(false);
      return;
    }
    if (d === '.' && current.includes('.')) return;
    setCurrent((c) => (c === '0' && d !== '.' ? d : c + d));
  }

  function pressOp(next: Op) {
    const value = parseFloat(current);
    if (prev !== null && op && !freshEntry) {
      const result = apply(prev, value, op);
      setPrev(result);
      setExpr(`${format(result)} ${next}`);
    } else {
      setPrev(value);
      setExpr(`${format(value)} ${next}`);
    }
    setOp(next);
    setFreshEntry(true);
  }

  function pressEquals() {
    if (op === null || prev === null) return;
    const value = parseFloat(current);
    setExpr(`${format(prev)} ${op} ${format(value)}`);
    const result = apply(prev, value, op);
    setCurrent(format(result));
    setPrev(null);
    setOp(null);
    setFreshEntry(true);
  }

  function pressPercent() {
    setCurrent((c) => format(parseFloat(c) / 100));
    setFreshEntry(true);
  }

  function pressClear() {
    setCurrent('0');
    setPrev(null);
    setOp(null);
    setExpr('');
    setFreshEntry(true);
  }

  function pressBackspace() {
    setCurrent((c) => (c.length > 1 ? c.slice(0, -1) : '0'));
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Calculator</Text>
          <Text style={styles.subtitle}>24 Aug · last used 11:06</Text>
        </View>
        <IconButton>
          <IconClock size={18} />
        </IconButton>
      </View>

      <View style={styles.body}>
        <View style={styles.out}>
          <Text style={styles.expr} numberOfLines={1}>
            {expr || ' '}
          </Text>
          <Text style={styles.val} numberOfLines={1} adjustsFontSizeToFit>
            {current}
          </Text>
        </View>

        <View style={styles.grid}>
          <CalcKey label="AC" variant="fn" onPress={pressClear} />
          <CalcKey label="( )" variant="fn" />
          <CalcKey label="%" variant="fn" onPress={pressPercent} />
          <CalcKey label="÷" variant="op" onPress={() => pressOp('÷')} />

          <CalcKey label="7" onPress={() => pressDigit('7')} />
          <CalcKey label="8" onPress={() => pressDigit('8')} />
          <CalcKey label="9" onPress={() => pressDigit('9')} />
          <CalcKey label="×" variant="op" onPress={() => pressOp('×')} />

          <CalcKey label="4" onPress={() => pressDigit('4')} />
          <CalcKey label="5" onPress={() => pressDigit('5')} />
          <CalcKey label="6" onPress={() => pressDigit('6')} />
          <CalcKey label="−" variant="op" onPress={() => pressOp('−')} />

          <CalcKey label="1" onPress={() => pressDigit('1')} />
          <CalcKey label="2" onPress={() => pressDigit('2')} />
          <CalcKey label="3" onPress={() => pressDigit('3')} />
          <CalcKey label="+" variant="op" onPress={() => pressOp('+')} />

          <View style={styles.backspace}>
            <IconButton onPress={pressBackspace} style={styles.backspaceBtn}>
              <IconDelete size={17} strokeWidth={2} />
            </IconButton>
          </View>
          <CalcKey label="0" onPress={() => pressDigit('0')} />
          <CalcKey label="." onPress={() => pressDigit('.')} />
          <CalcKey label="=" variant="eq" onPress={pressEquals} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.ink,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four - 6,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three - 2,
  },
  title: {
    fontFamily: Fonts.extraBold,
    fontSize: 21,
    letterSpacing: -0.4,
    color: Colors.text,
  },
  subtitle: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 3,
  },
  body: {
    flex: 1,
    paddingHorizontal: Spacing.four - 6,
    justifyContent: 'flex-end',
    paddingBottom: Spacing.three,
  },
  out: {
    alignItems: 'flex-end',
    paddingVertical: 18,
    paddingHorizontal: 4,
  },
  expr: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.42)',
  },
  val: {
    fontFamily: Fonts.extraBold,
    fontSize: 42,
    lineHeight: 46,
    letterSpacing: -0.8,
    color: Colors.text,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },
  backspace: {
    flexBasis: '23%',
    flexGrow: 1,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backspaceBtn: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
  },
});
