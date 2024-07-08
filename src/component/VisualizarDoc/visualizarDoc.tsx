import React, { useEffect, useState } from "react";
import Conteudo from "../../compenentes-compartilhados/Conteudo/Conteudo";
import { Grid } from "@mui/material";
import './VisualizarDoc.css';
import Funcoes from "./Funcoes/Funcoes";
import Box from "../../compenentes-compartilhados/Box/Box";
import { useParams } from "react-router";
import parse from 'html-react-parser';
import { buscarMobilPorSigla } from '../Documento/Service/Service';
import { listarCossignatario, excluirCossignatario } from "../Incluir-Consignatario/Servico/ServiceT";
import { buscarUsuarioPorId } from "../Usuario/Servico/usuario.service";
import Swal from "sweetalert2";

interface Cossignatario {
  pessoaRecebedoraId: string;
  movementId: number; 
  userDetails: {
    nome: string;
    matricula: string;
  };
}

function VisualizarDoc() {
  const { codigo } = useParams<{ codigo: string }>();
  const [html, setHtml] = useState<string>("");
  const [lista, setLista] = useState<Cossignatario[]>([]);
  const [mobilId, setMobilId] = useState<number>(0); // Ajuste para número
  const codigoDocumento = codigo || "";

  useEffect(() => {
    localStorage.clear();
    buscarDocumento();
  }, [codigoDocumento]);

  useEffect(() => {
    if (mobilId !== 0) {
      listarCossignatarios();
    }
  }, [mobilId]);

  async function buscarDocumento() {
    try {
      const mobil = await buscarMobilPorSigla(codigoDocumento);
      if (mobil) {
        setMobilId(mobil.mobilId); 
        setHtml(mobil.documento.file);
      }
    } catch (error) {
      console.error('Erro ao buscar documento:', error);
    }
  }

  async function listarCossignatarios() {
    try {
      const list = await listarCossignatario(mobilId, "INCLUSAO_DE_COSIGNATARIO");
      const cossignatarios = await buscarDetalhesDosUsuarios(list.content);
      setLista(cossignatarios);
    } catch (error) {
      console.error('Erro ao buscar cosignatários:', error);
    }
  }

  async function buscarDetalhesDosUsuarios(cossignatarios: any[]): Promise<Cossignatario[]> {
    const detalhesPromises = cossignatarios.map(async (item) => {
      const userDetails = await buscarUsuarioPorId(item.pessoaRecebedoraId);
      return { ...item, userDetails };
    });
    return Promise.all(detalhesPromises);
  }

  async function handleDelete(item: Cossignatario, index: number) {
    const result = await Swal.fire({
      title: `Deseja excluir o cossignatário ${item.userDetails.nome}?`,
      text: "Você não poderá reverter isso!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sim, excluir!'
    });

    if (result.isConfirmed) {
      try {
        await excluirCossignatario(codigoDocumento, item.movementId.toString()); 
        const newLista = lista.filter((_, i) => i !== index);
        setLista(newLista);
        Swal.fire('Excluído!', 'O cossignatário foi excluído.', 'success');
      } catch (error) {
        console.error('Erro ao excluir cossignatário:', error);
        Swal.fire('Erro!', 'O documento está finalizado.', 'error');
      }
    }
  }

  return (
    <Conteudo>
      <h2>{codigoDocumento}</h2>
      <Funcoes codigoDocumento={codigoDocumento} />
      <Grid container spacing={2}>
        <Grid item xs={7} sm={9}>
          <div className="VisuDoc">
            {parse(html)}
          </div>
        </Grid>
        <Grid item xs={5} sm={3}>
          <Box
            array={lista}
            titulo="Cossignatários"
            renderItem={(item, index) => (
              <div key={index} className="BoxListItem">
                <p>{item.userDetails.nome}</p>
              </div>
            )}
            onDelete={handleDelete}
          />
        </Grid>
      </Grid>
    </Conteudo>
  );
}

export default VisualizarDoc;
