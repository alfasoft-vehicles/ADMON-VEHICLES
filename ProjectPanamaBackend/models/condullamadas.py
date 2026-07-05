from config.dbconnection import Base
from sqlalchemy import DATE, TEXT, Column, DATETIME, CHAR, DECIMAL

class Condullamadas(Base):
  __tablename__ = "CONDULLAMADAS"
  EMPRESA = Column(CHAR(2), primary_key=True)
  DESDE = Column(DATE)
  HASTA = Column(DATE)
  DETALLE = Column(TEXT)
  INTERNO = Column(TEXT)
  HORA = Column(CHAR(8))
  UNIDAD = Column(CHAR(8))
  PLACA = Column(CHAR(8))
  CONDUCTOR = Column(CHAR(12))
  NUMERO = Column(DECIMAL(8,0))
  USUARIO = Column(CHAR(10))
  FEC_DOCUM = Column(CHAR(8))
  FEC_CREADO = Column(DATETIME)