from models.conductores import Conductores

def normalize_phone(phone: str, remove_country_code: bool = False):
  digits = ''.join(char for char in (phone or '') if char.isdigit())

  if remove_country_code and digits.startswith('507') and len(digits) > 8:
    digits = digits[3:]

  return digits

def get_drivers_by_phone(db, company_code: str):
  drivers = db.query(
    Conductores.CODIGO, Conductores.CEDULA, Conductores.TELEFONO, Conductores.CELULAR,
    Conductores.UND_NRO, Conductores.UND_PRE, Conductores.COMISI_BCO
  ).filter(Conductores.EMPRESA == company_code).all()

  drivers_by_phone = {}
  for driver in drivers:
    for phone in (driver.TELEFONO, driver.CELULAR):
      phone = normalize_phone(phone)
      if phone:
        drivers_by_phone.setdefault(phone, {})[driver.CODIGO] = driver

  return drivers_by_phone