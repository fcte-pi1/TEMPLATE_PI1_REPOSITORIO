import { useEffect, useState } from "react";
import { FaCheck, FaCircleCheck } from "react-icons/fa6";
import { FiDownload } from "react-icons/fi";
import { VscErrorCompact } from "react-icons/vsc";
import { IoMdClock } from "react-icons/io";
import { MdBatteryChargingFull, MdGridOn, MdRotateRight, MdSpeed, MdStraighten } from "react-icons/md";

import { TbReportMedical } from "react-icons/tb";

type Execution = {
    id: string;
    maze: string;
    algorithm: string;
    date: string;
    status: "Concluída" | "Não concluída";
    duration: string;
    averageSpeed: string;
    cellsVisited: number;
    averageRpm: number;
    batteryConsumed: string;
    distance: string;
};

const executions: Execution[] = [
    { id: "0014", maze: "Labirinto", algorithm: "Flood Fill v2", date: "18 set 2026", status: "Concluída", duration: "03:42", averageSpeed: "0,42 m/s", cellsVisited: 64, averageRpm: 320, batteryConsumed: "12%", distance: "18,6 m" },
    { id: "0013", maze: "Labirinto", algorithm: "Flood Fill v2", date: "15 set 2026", status: "Não concluída", duration: "05:18", averageSpeed: "0,28 m/s", cellsVisited: 41, averageRpm: 265, batteryConsumed: "19%", distance: "14,2 m" },
];

function createReportPdf(execution: Execution) {
    const lines = [
        `Relatorio da execucao #${execution.id}`,
        `${execution.maze} - ${execution.algorithm}`,
        `Status: ${execution.status}`,
        `Tempo total: ${execution.duration}`,
        `Velocidade media: ${execution.averageSpeed}`,
        `Celulas visitadas: ${execution.cellsVisited}`,
        `RPM medio: ${execution.averageRpm}`,
        `Bateria consumida: ${execution.batteryConsumed}`,
        `Distancia percorrida: ${execution.distance}`,
        "Conteudo: Resumo executivo, mapa do labirinto explorado, graficos de telemetria,",
        "log de eventos, analise de algoritmo e comparativo com execucoes anteriores.",
    ];
    const safeLines = lines.map((line) => line.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, ""));
    const stream = ["BT", "/F1 12 Tf", "50 790 Td", ...safeLines.flatMap((line, index) => [index ? "0 -24 Td" : "", `(${line.replace(/[\\()]/g, "\\$&")}) Tj`]).filter(Boolean), "ET"].join("\n");
    const objects = [
        "<< /Type /Catalog /Pages 2 0 R >>",
        "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    ];
    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((object, index) => {
        offsets.push(pdf.length);
        pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
    });
    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return new Blob([pdf], { type: "application/pdf" });
}

export function RelatorioPage() {
    const [progress, setProgress] = useState(0);
    const [generating, setGenerating] = useState(false);
    const [pdfUrl, setPdfUrl] = useState("");
    const [fileSize, setFileSize] = useState(0);
    const [selectedExecutionId, setSelectedExecutionId] = useState("0014");
    const selectedExecution = executions.find((execution) => execution.id === selectedExecutionId) ?? executions[0];

    useEffect(() => {
        if (!generating) return;
        const timer = window.setTimeout(() => setProgress((current) => Math.min(current + 5, 100)), 90);
        return () => window.clearTimeout(timer);
    }, [generating, progress]);

    useEffect(() => {
        if (progress !== 100 || !generating) return;
        const pdf = createReportPdf(selectedExecution);
        setPdfUrl(URL.createObjectURL(pdf));
        setFileSize(pdf.size);
        setGenerating(false);
    }, [generating, progress, selectedExecution]);

    useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl); }, [pdfUrl]);

    function startGeneration() {
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        setPdfUrl("");
        setFileSize(0);
        setProgress(0);
        setGenerating(true);
    }

    function selectExecution(executionId: string) {
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        setPdfUrl("");
        setFileSize(0);
        setProgress(0);
        setGenerating(false);
        setSelectedExecutionId(executionId);
    }

    return(
        <main className="flex-1 overflow-y-auto px-4 pb-4 pt-34 text-slate-200 sm:p-12">


            <header className="">
                <h1 className="text-2xl font-semibold text-slate-100">Relatórios</h1>
                <span className="text-sm text-slate-400">
                    Geração de relatórios em PDF por execução
                </span>
            </header>
            
            <div className="mt-5 flex h-full w-full flex-col gap-[20px] lg:flex-row">

                
                <div className="h-[600px] w-full shrink-0 bg-[#0B1628] border border-[#1D293D]/60 rounded-[12px] px-[10px] pt-3 flex flex-col gap-2 lg:w-[700px]" >
                    <p > Selecionar Execução</p>

                    {executions.map((execution) => {
                        const isSelected = execution.id === selectedExecutionId;
                        const completed = execution.status === "Concluída";
                        return (
                            <button
                                key={execution.id}
                                type="button"
                                onClick={() => selectExecution(execution.id)}
                                aria-pressed={isSelected}
                                className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg border p-2 text-left transition hover:bg-[#00B8DB]/10 ${isSelected ? "border-[#00B8DB]/40 bg-[#00B8DB]/10" : "border-transparent hover:border-[#00B8DB]/20"}`}
                            >
                                <span className="flex flex-row gap-3">
                                    <span className={`mt-1 h-2 w-2 rounded-full ${completed ? "bg-[#00D492]" : "bg-[#FF6467]"}`} />
                                    <span className="flex flex-col gap-1 text-[12px]">
                                        <span>#{execution.id}</span>
                                        <span>{execution.maze} · {execution.algorithm}</span>
                                        <span>{execution.date}</span>
                                    </span>
                                </span>
                                {completed
                                    ? <FaCheck className="h-3 w-3 shrink-0 text-[#00D492]" />
                                    : <VscErrorCompact className="h-3 w-3 shrink-0 text-[#FF6467]" />}
                            </button>
                        );
                    })}



                </div>

               <div className="w-full min-w-0 flex flex-col gap-4">

                 <div className="h-[390px] w-full bg-[#0B1628] h-[500px] border border-[#1D293D]/60 rounded-[12px] p-4" >
                    
                    
                    <div className="flex justify-between">
                        <div>
                            <p className="text-[14px]">Execução #{selectedExecution.id}</p>
                            <span className="text-[#62748E] text-[12px]">{selectedExecution.maze} · {selectedExecution.algorithm} · {selectedExecution.date}</span>
                        </div>
                        
                        <p className={`text-[14px] ${selectedExecution.status === "Concluída" ? "text-[#00D492]" : "text-[#FF6467]"}`}>{selectedExecution.status}</p>


                    </div>



                <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3">
                    {[
                        { label: "Tempo de execução", value: selectedExecution.duration, Icon: IoMdClock },
                        { label: "Velocidade média", value: selectedExecution.averageSpeed, Icon: MdSpeed },
                        { label: "Células visitadas", value: String(selectedExecution.cellsVisited), Icon: MdGridOn },
                        { label: "RPM médio", value: String(selectedExecution.averageRpm), Icon: MdRotateRight },
                        { label: "Bateria consumida", value: selectedExecution.batteryConsumed, Icon: MdBatteryChargingFull },
                        { label: "Distância percorrida", value: selectedExecution.distance, Icon: MdStraighten },
                    ].map(({ label, value, Icon }) => (
                        <div key={label} className="flex min-h-[92px] flex-col justify-center rounded-[8px] bg-[#0F172B] p-4">
                            <Icon className="h-5 w-5 text-[#00B8DB]" aria-hidden="true" />
                            <p className="mt-1 text-lg text-slate-100">{value}</p>
                            <span className="text-[12px] text-[#62748E]">{label}</span>
                        </div>
                    ))}

                    <div className="col-span-3 w-full min-w-0">
                        <p className="text-[#62748E] text-[12px] uppercase">Conteúdo do Relatório</p>

                        <div className="grid w-full min-w-0 grid-cols-[repeat(2,minmax(0,1fr))] gap-x-6 gap-y-2">
                  {[
                    'Resumo executivo',
                    'Mapa do labirinto explorado',
                    'Gráficos de telemetria',
                    'Log de eventos',
                    'Análise de algoritmo',
                    'Comparativo com execuções anteriores',
                  ].map((item) => (
                    <div key={item} className="flex min-w-0 items-center gap-2 text-xs text-slate-400">
                      <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={2.5} className="w-3.5 h-3.5 flex-shrink-0">
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="min-w-0">{item}</span>
                    </div>
                  ))}

                  
                </div>
                    </div>
                    
                </div>

                    


                </div>

                <div className="min-h-[126px] w-full bg-[#0B1628] border border-[#1D293D]/60 rounded-[12px] p-4 flex flex-col gap-4" >
               
               
               
                    {generating ? (
                        <div className="flex flex-col gap-2" aria-live="polite">
                            <div className="flex justify-between text-xs text-[#62748E]"><span>Gerando relatório...</span><span>{progress}%</span></div>
                            <div className="h-2 w-full overflow-hidden rounded-full bg-[#1D293D]" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
                                <div className="h-full rounded-full bg-[#00B8DB] transition-all duration-200" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    ) : pdfUrl ? (
                        <div className="flex w-full flex-col gap-3" aria-live="polite">
                            <div className="flex w-full items-center gap-3 rounded-[8px] border border-[#00D492]/30 bg-[#00D492]/10 p-3">
                                <FaCircleCheck className="h-5 w-5 shrink-0 text-[#00D492]" aria-hidden="true" />
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-[#00D492]">Relatório gerado com sucesso!</p>
                                    <p className="break-all text-xs text-[#62748E]">micronav-relatorio-0047.pdf · {(fileSize / 1024).toFixed(2)} KB</p>
                                </div>
                            </div>
                            <div className="flex w-full items-center gap-3">
                                <a href={pdfUrl} download="micronav-relatorio-0047.pdf" className="flex min-w-0 flex-[4] items-center justify-center gap-2 rounded-[8px] bg-[#00B8DB] px-3 py-2 text-sm text-white">
                                    <FiDownload className="h-4 w-4" aria-hidden="true" />Exportar PDF
                                </a>
                                <button onClick={startGeneration} className="flex-[1] cursor-pointer whitespace-nowrap rounded-[8px] border border-[#1D293D] px-3 py-2 text-sm">Novo relatório</button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <span className="text-[12px] text-[#62748E]">Clique em <span className="text-white">Gerar Relatório PDF</span> para compilar os dados desta execução.</span>
                            <button onClick={startGeneration} className="flex cursor-pointer items-center justify-center gap-2 rounded-[8px] bg-[#00B8DB] px-2 py-2 text-[15px]"> <TbReportMedical className="h-[20px] w-[20px]"/>Gerar Relatório PDF</button>
                        </>
                    )}
               
               
                </div>
               </div>

                
            </div>

        </main>
    )
}
