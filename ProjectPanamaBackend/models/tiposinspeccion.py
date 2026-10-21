from config.dbconnection import Base
from sqlalchemy import Column, String, Numeric, DateTime

class TiposInspeccion(Base):
  __tablename__='TIPOSINSPECCION'
  EMPRESA = Column(String(2), nullable=False)
  CODIGO = Column(String(2), primary_key=True, nullable=False)
  NOMBRE = Column(String(40))
  TIPO = Column(String(2), nullable=False) 
  FEC_CREADO = Column(DateTime)