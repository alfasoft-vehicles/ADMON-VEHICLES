from sqlalchemy import Column, DateTime, CHAR, VARCHAR
from config.dbconnection import Base

class FormasPago(Base):
  __tablename__ = 'FORMASPAGO'

  EMPRESA = Column(CHAR(2), primary_key=True)
  CODIGO = Column(CHAR(2), primary_key=True)
  NOMBRE = Column(VARCHAR(15))