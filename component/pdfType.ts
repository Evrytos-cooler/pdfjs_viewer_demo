import { PDFPageProxy } from 'pdfjs-dist/types/web/interfaces'

interface pdfViewerProps extends React.AllHTMLAttributes<HTMLElement> {
	pdfUrl: string
}
export default pdfViewerProps
export interface pdfThumbnailProps extends React.AllHTMLAttributes<HTMLElement> {
	pageProxy: Promise<PDFPageProxy>
	targetPage: number
}
