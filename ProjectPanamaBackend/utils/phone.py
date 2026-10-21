def normalize_phone(phone: str, remove_country_code: bool = False):
  digits = ''.join(char for char in (phone or '') if char.isdigit())

  if remove_country_code and digits.startswith('507') and len(digits) > 8:
    digits = digits[3:]

  return digits