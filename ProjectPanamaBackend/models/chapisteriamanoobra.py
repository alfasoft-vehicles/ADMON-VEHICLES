from config.dbconnection import Base
from sqlalchemy import Column, CHAR, VARCHAR, DECIMAL, Date, TEXT, DateTime

class ChapisteriaManoObra(Base):
  __tablename__ = 'CHAPISTERIAMANOOBRA'

  EMPRESA = Column(CHAR(2), primary_key=True)
  CONSECUTIV = Column(DECIMAL(6, 0))
  FECHA = Column(Date)
  HORA = Column(CHAR(5))
  PLACA = Column(CHAR(8))
  NUMERO = Column(CHAR(8))
  CONDUCTOR = Column(CHAR(12))
  NOMCONDUC = Column(VARCHAR(50))
  PROPI_IDEN = Column(CHAR(12))
  NOMPROPIE = Column(VARCHAR(50))
  VLR_MANOBR = Column(DECIMAL(10, 2))
  REPARACION = Column(TEXT)
  REPUESTOS = Column(TEXT)
  OBSERVA = Column(VARCHAR(150))
  FEC_DOCUM = Column(CHAR(8))
  USUARIO = Column(CHAR(10))
  FEC_CREADO = Column(DateTime)
  SEL = Column(CHAR(1))