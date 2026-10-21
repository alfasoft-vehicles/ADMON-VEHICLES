from config.dbconnection import Base
from sqlalchemy import Column, CHAR, Text, DECIMAL, DateTime

class Mecanicos(Base):
  __tablename__ = 'MECANICOS'
  EMPRESA = Column(CHAR(2), nullable=False)
  CODIGO = Column(CHAR(12), primary_key=True, nullable=False)
  NOMBRE = Column(CHAR(50))
  NIT = Column(DECIMAL(10, 0))
  CONTROL = Column(CHAR(2))
  CIUDAD = Column(CHAR(5))
  DIRECCION = Column(CHAR(60))
  TELEFONO = Column(CHAR(30))
  CELULAR = Column(CHAR(30))
  REPRESENTA = Column(CHAR(40))
  CONTACTO = Column(CHAR(40))
  CORREO = Column(CHAR(40))
  FOTO = Column(CHAR(250))
  FEC_CREADO = Column(DateTime)
  USU_CREADO = Column(CHAR(12))
  USU_MODIFI = Column(CHAR(12))