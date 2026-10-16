# Omnintellx Python Calculator CLI

An autonomous, test-driven Python calculator CLI built by Omnintellx.

## Features
- `add(a, b)`: Addition
- `subtract(a, b)`: Subtraction
- `multiply(a, b)`: Multiplication
- `divide(a, b)`: Division with zero-division error handling

## Testing
Run unit tests with:
```bash
python3 -m unittest discover -s . -p "test_*.py"
```

## CLI Usage
```bash
python3 calculator.py add 10 25
python3 calculator.py multiply 6 7
python3 calculator.py divide 100 4
```
