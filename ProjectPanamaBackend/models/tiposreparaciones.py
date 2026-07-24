from config.dbconnection import Base
from sqlalchemy import Column, String, Numeric, DateTime, VARCHAR, CHAR

class TiposReparaciones(Base):
  __tablename__='TIPOSREPARACIONES'
  EMPRESA = Column(CHAR(2), nullable=False)
  CODIGO = Column(CHAR(2), primary_key=True, nullable=False)
  NOMBRE = Column(VARCHAR(200))
  FEC_CREADO = Column(DateTime)