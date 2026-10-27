import { RunRow } from "./RunRow";

interface TableProps {
    filter:string
}
export function Table({filter}: TableProps) {


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
    },
    {
   id: 3,
        labirinto: "LabirintoBA",
        data: new Date('2026-09-18'),
        tempo: "2:30",
        algoritmo: "Flood Fill v2",
        celulas: 123,
        status: "Sucesso" ,
        resultado: "Meta atingida"
    
}
  

    


]   


    
    return( 


    <div className="mt-5   max-h-125  overflow-x-auto rounded-xl border border-[#1D293D]/60 ">
      <table className="w-full bg-[#0B1628] text-sm text-white ">
          <thead className=" text-[#8A99AD] border-b border-[#1D293D] ">
            
            
            <tr className="text-left">
              <th className="px-5 py-4 font-medium">ID</th>
              <th className="px-5 py-4 font-medium">LABIRINTO</th>
              <th className="px-5 py-4 font-medium">DATA</th>
              <th className="px-5 py-4 font-medium">TEMPO</th>
              <th className="px-5 py-4 font-medium">ALGORITMO</th>
              <th className="px-5 py-4 font-medium">CÉLULAS</th>
              <th className="px-5 py-4 font-medium">STATUS</th>
              <th className="px-5 py-4 font-medium">RESULTADO</th>
            </tr>
          </thead>

          <tbody>
            {runs.filter((run) => {

                if(filter === 'sucesso') return run.status === 'Sucesso';

                if(filter === 'falhou') return run.status === 'Falhou';
                return true;
            }).map((run) => (
              <RunRow key={run.id} data={run.data} id={run.id} labirinto={run.labirinto} algoritmo={run.algoritmo} tempo={run.tempo} celulas={run.celulas} status={run.status} resultado={run.resultado}/>
            ))}

          </tbody>
        </table>
        </div>
    )
}