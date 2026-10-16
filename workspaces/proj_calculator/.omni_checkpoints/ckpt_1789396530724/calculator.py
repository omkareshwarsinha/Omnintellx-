#!/usr/bin/env python3
"""
Omnintellx Production Python Calculator CLI
Provides robust arithmetic functions: add, subtract, multiply, divide.
"""
import sys

def add(a: float, b: float) -> float:
    """Returns the sum of a and b."""
    return a + b

def subtract(a: float, b: float) -> float:
    """Returns the difference of a and b."""
    return a - b

def multiply(a: float, b: float) -> float:
    """Returns the product of a and b."""
    return a * b

def divide(a: float, b: float) -> float:
    """Returns the division of a by b. Raises ValueError on division by zero."""
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b

def main():
    if len(sys.argv) < 4:
        print("Usage: python3 calculator.py <operation: add|sub|mul|div> <num1> <num2>")
        sys.exit(1)
    
    op = sys.argv[1].lower()
    try:
        a = float(sys.argv[2])
        b = float(sys.argv[3])
    except ValueError:
        print("Error: Operands must be valid numbers.")
        sys.exit(1)

    operations = {
        'add': add,
        'sub': subtract,
        'subtract': subtract,
        'mul': multiply,
        'multiply': multiply,
        'div': divide,
        'divide': divide
    }

    if op not in operations:
        print(f"Unknown operation: {op}")
        sys.exit(1)

    try:
        result = operations[op](a, b)
        print(f"Result: {result}")
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
