import {compareAsc, format} from 'date-fns'
import {ptBR} from 'date-fns/locale'


interface RunRowProps {
    id:number;
    labirinto:string;
    data:Date;
    tempo:string;
    algoritmo:string;
    celulas:number;
    status:string;
    resultado:string;
}

export function RunRow({
algoritmo,
celulas,
data,   
id,
labirinto,
resultado,
status,
tempo
}:RunRowProps){


    const formateDate = format(data, "dd MMM yyyy", {locale: ptBR})
    return(
        <tr className="transition-colors hover:bg-[#111E31]">
              <td className="px-5 py-4 font-medium text-[#00D3F3]"># {id}</td>
              <td className="px-5 py-4">{labirinto}</td>
              <td className="px-5 py-4 text-[#8A99AD]">{formateDate}</td>
              <td className="px-5 py-4">{tempo}</td>
              <td className="px-5 py-4">{algoritmo}</td>
              <td className="px-5 py-4">{celulas}</td>
              <td className="px-5 py-4">
                {status === "Sucesso" ? (
                        <span className="rounded-md bg-[#00BC7D]/10 px-3 py-1 text-[#00BC7D]">
                  Sucesso
                </span>
                ): (

                        <span className="rounded-md bg-[#FF6467]/10 px-3 py-1 text-[#FF6467]">
                  Falhou
                </span>
                )}
              </td>
              <td className="px-5 py-4 text-[#8A99AD]">{resultado}</td>
            </tr>
    )
}