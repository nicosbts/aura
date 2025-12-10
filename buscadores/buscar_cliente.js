// BUSCADOR DE CLIENTES
const oracledb = require("oracledb");
const dbConfig = require("../../../../../../connection/dbconfig");
const crypto = require("../../../../../../utils/crypto");

exports.main = async (req, res, next) => {
  console.log("===> BUSCAR CLIENTE ejecutado");
  console.log("Body:", req.body);

  const cod_empresa = req.body.cod_empresa;
  let valor       = req.body.valor;
  if(valor != 'null' && valor != undefined){
  valor = '%' + valor.replace(' ', '%') + '%';
  }

  let connection;
  try {
    connection = await oracledb.getConnection({
      ...dbConfig,
      user: req.headers.authuser,
      password: await crypto.decrypt(req.headers.authpass),
    });

    const sql = `
      SELECT 
        c.cod_cliente,
        (c.primer_nombre || ' ' || c.primer_apellido) AS desc_cliente
      FROM cc_clientes_controlados c
      WHERE c.cod_empresa = :p_cod_empresa
        and (c.cod_cliente like '%' || :valor || '%' or 
                        upper(c.primer_nombre) like '%' || upper(:valor) || '%' or
                        upper(c.primer_apellido) like '%' || upper(:valor) || '%' or :valor = 'null')
        and rownum <=20
      ORDER BY c.cod_cliente
    `;

    const binds = {
      p_cod_empresa: cod_empresa,
      valor: valor,
    };

    console.log("SQL:", sql);
    console.log("Binds: ", binds);

    const result = await connection.execute(sql, binds, {
      outFormat: oracledb.OBJECT,
    });

    res.status(200).json(result.rows);
  } catch (error) {
    console.error("Error en buscar_cliente:", error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.log("Error al cerrar la conexión:", error);
      }
    }
  }
};