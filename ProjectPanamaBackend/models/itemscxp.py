from config.dbconnection import Base
from sqlalchemy import Column, CHAR, Text, DECIMAL, DateTime

class ItemsCXP(Base):
  __tablename__ = 'ITEMSCXP'
  EMPRESA = Column(CHAR(2), nullable=False)
  CODIGO = Column(CHAR(4), primary_key=True, nullable=False)
  NOMBRE = Column(CHAR(50))
  DETALLE = Column(Text)
  VALOR = Column(DECIMAL(12, 2))
  FEC_CREADO = Column(DateTime)