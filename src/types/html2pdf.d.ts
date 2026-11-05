declare module "html2pdf.js" {
  export interface Html2PdfOptions {
    margin?: number | [number, number, number, number];
    filename?: string;
    image?: { type?: string; quality?: number };
    enableLinks?: boolean;
    html2canvas?: {
      scale?: number;
      useCORS?: boolean;
      logging?: boolean;
      letterRendering?: boolean;
      allowTaint?: boolean;
      [key: string]: any;
    };
    jsPDF?: {
      unit?: string;
      format?: string | [number, number];
      orientation?: "portrait" | "landscape";
      compress?: boolean;
      [key: string]: any;
    };
    pagebreak?: {
      mode?: string | string[];
      before?: string | string[];
      after?: string | string[];
      avoid?: string | string[];
    };
  }

  export interface Html2PdfInstance {
    set(opt: Html2PdfOptions): Html2PdfInstance;
    from(src: HTMLElement | string): Html2PdfInstance;
    save(): Promise<void>;
    output(type?: string, options?: any): Promise<any>;
    outputPdf(type?: string): Promise<any>;
    outputImg(type?: string): Promise<any>;
    toPdf(): Html2PdfInstance;
    get(type: string): Promise<any>;
  }

  function html2pdf(): Html2PdfInstance;
  function html2pdf(element: HTMLElement | string, opt?: Html2PdfOptions): Html2PdfInstance;

  export default html2pdf;
}
