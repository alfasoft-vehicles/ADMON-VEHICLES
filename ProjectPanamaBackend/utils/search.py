from sqlalchemy import func

def contains(column, text: str):
  return func.lower(column).contains(text.lower(), autoescape=True)

def digits_only(column):
  for char in ('-', ' ', '(', ')', '+'):
    column = func.replace(column, char, '')
  return column