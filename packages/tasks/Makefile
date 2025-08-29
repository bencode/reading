.PHONY: lint format check install

# Install dependencies
install:
	pip install -r requirements.txt

# Format code with black and isort
format:
	python -m black .
	python -m isort .

# Run linting checks
lint:
	python -m flake8 .
	python -m black --check .
	python -m isort --check-only .

# Check code quality (lint + format check)
check: lint

# Fix formatting issues
fix: format