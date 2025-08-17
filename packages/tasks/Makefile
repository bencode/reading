.PHONY: lint format check install

# Install dependencies
install:
	pip install -r requirements.txt

# Format code with black and isort
format:
	black .
	isort .

# Run linting checks
lint:
	flake8 .
	black --check .
	isort --check-only .

# Check code quality (lint + format check)
check: lint

# Fix formatting issues
fix: format