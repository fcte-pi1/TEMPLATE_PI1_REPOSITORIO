import { useState } from "react";
import { Table } from "../components/historico/Table";
import { ButtonSelect } from "../components/historico/ButtonSelect";

export function HistoryPage() {


  const [filter, setFilter] = useState('todos') 


    const runs = [
{
     id: 2,
        labirinto: "LabirintoBA",
        data: new Date('2026-09-18'),
        tempo: "2:30",
        algoritmo: "Flood Fill v2",
        celulas: 123,
        status: "Sucesso" ,
        resultado: "Meta atingida"
    }

    


]   

  const percentageSucess = runs.filter(run=> run.status==='Sucesso').length/ runs.length * 100
  const totalCells = runs.reduce((acc, run) => acc + run.celulas, 0) / runs.length
  const totalExecutions = runs.length
  return (
    <div className="flex-1 overflow-y-auto px-4 pb-4 pt-34 text-slate-200 sm:p-12">
      <header>
        <h1 className="text-white text-[26px]">Histórico</h1>
        <span className="text-[12px] text-white/30">
          {totalExecutions} execuções registradas
        </span>
      </header>

      <main>
        <div className=" flex justify-between items-center mt-15.25 ">
          <div className="flex  gap-5">

            <ButtonSelect label="Todos" value="todos" name="filtro" defaultChecked onChange={e=>  setFilter(e.target.value)} />
            <ButtonSelect label="Sucesso" value="sucesso" name="filtro" onChange={e=> setFilter(e.target.value)} />
            <ButtonSelect label="Falhou" value="falhou" name="filtro"  onChange={e=> setFilter(e.target.value)} />
          </div>

          <span className="text-[12px] text-white/30">
            {totalExecutions} execuções registradas
          </span>
        </div>


        <Table filter={filter}/>


        <div  className="mt-5 flex justify-between" >
            <div className="w-75.5 h-22 bg-[#0B1628] border border-[#1D293D]/60 rounded-xl flex flex-col items-center justify-center">
                <p className="text-[16px] font-bold text-[#00D492]">{percentageSucess.toFixed(0)}%</p>
                <span className="text-white/60 text-[12px] ">Taxa de sucesso</span>
            </div>

            <div className="w-75.5 h-22 bg-[#0B1628] border border-[#1D293D]/60 rounded-xl flex flex-col items-center justify-center">
                <p className="text-[16px] font-bold text-[#00D3F3]">05:24</p>
                <span className="text-white/60 text-[12px] ">Tempo Médio</span>
            </div>


            <div className="w-75.5 h-22 bg-[#0B1628] border border-[#1D293D]/60 rounded-xl flex flex-col items-center justify-center">
                <p className="text-[16px] font-bold text-white">{totalCells.toFixed(0)}</p>
                <span className="text-white/60 text-[12px] ">Média Total de Células</span>
            </div>
        </div>



      </main>
    </div>
  );
}
