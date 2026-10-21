def clean_text(text):
  """Remove commas and other characters from text"""
  if text is None:
    return ''
  return str(text).replace(',', ' ').replace('\n', ' ').replace('\r', ' ').strip()