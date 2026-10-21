from sqlalchemy import Column, DateTime, CHAR, INT, DECIMAL
from config.dbconnection import Base

class CXCTiposRecargos(Base):
  __tablename__ = 'CXCTIPOSRECARGOS'

  EMPRESA = Column(CHAR(2), primary_key=True)
  CODIGO = Column(CHAR(3), primary_key=True)
  NOMBRE = Column(CHAR(40))
  ABREVIADO = Column(CHAR(10))
  COMI_COBR = Column(INT)
  SALDO = Column(DECIMAL(10,2))
  VALOR = Column(DECIMAL(10,2))
  FEC_CREADO = Column(DateTime)