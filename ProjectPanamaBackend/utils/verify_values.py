from decimal import Decimal

def verify_value(value1, value2=None):

  if value1 is None or value1 == "":
    return False

  if value2 is not None:
    if not isinstance(value1, (int, float, Decimal)) or not isinstance(value2, (int, float, Decimal)):
      return False

    if value1 <= value2:
      return False

  return True