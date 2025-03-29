import React, { useEffect, useRef } from 'react'
import { pdfThumbnailProps } from './pdfType'
import { EventBus, PDFPageView } from 'pdfjs-dist/web/pdf_viewer.mjs'
import usePdfStore from '@/store/pdfStore/usePdfStore'
// import '../../../../node_modules/pdfjs-dist/web/pdf_viewer.css'

//pageProxy是一个返回pageProxy的Promise对象
const PdfThumbnail: React.FC<pdfThumbnailProps> = ({ pageProxy, targetPage }) => {
	const containerRef = useRef<HTMLDivElement>(null)
	//公共状态currentPage
	const { currentPage, setCurrentPage } = usePdfStore(state => ({
		currentPage: state.currentPage,
		setCurrentPage: state.setCurrentPage,
	}))
	/**
	 * @description 初始化缩略图
	 */
	const initailThumbnail = async () => {
		//初始化 落定pageProxy eventBus PageViewer 计算scale
		const pdfPage = await pageProxy
		const eventBus = new EventBus()
		const thumbnailViewer = new PDFPageView({
			textLayerMode: 0,
			container: containerRef.current as HTMLDivElement,
			eventBus: eventBus,
			id: targetPage,
			defaultViewport: pdfPage.getViewport({ scale: 1 }),
		})
		const scale = containerRef.current
			? containerRef.current.clientWidth / pdfPage.getViewport({ scale: 1 }).width
			: 0
		thumbnailViewer.scale = scale
		thumbnailViewer.setPdfPage(pdfPage)
		thumbnailViewer.draw()
		setCanvasWrapperSize()
		const refCopy = containerRef.current
		// return Promise.resolve(() => {
		// 	console.log(refCopy?.querySelectorAll('.page'))
		// 	refCopy
		// 		?.querySelectorAll('.page')[0]
		// 		?.parentNode?.removeChild(refCopy?.querySelectorAll('.page')[0])
		// })
		return () => {
			refCopy
				?.querySelectorAll('.page')[0]
				?.parentNode?.removeChild(refCopy?.querySelectorAll('.page')[0])
		}
	}

	const setCanvasWrapperSize = () => {
		if (containerRef.current) {
			//setSize
			containerRef.current.querySelectorAll('canvas').forEach(page => {
				page.setAttribute(
					'style',
					`width:${containerRef.current?.clientWidth}px;aspect:7/10`
				)
			})
			containerRef.current.querySelectorAll('.page').forEach(page => {
				page.setAttribute(
					'style',
					`width:${containerRef.current?.clientWidth}px;aspect:7/10`
				)
			})
			containerRef.current
				.querySelectorAll('.canvasWrapper')
				.forEach(canvasWrapper => {
					canvasWrapper.setAttribute(
						'style',
						`width:${containerRef.current?.clientWidth}px;aspect:7/10`
					)
				})
		}
	}
	//初始化Thumbnail，只在组件挂载的使用运行
	useEffect(() => {
		//layoutEffect是同步的
		let cleannerFuncPromise: Promise<() => void>
		const func = async () => {
			// cleannerFuncPromise = initailThumbnail()
			cleannerFuncPromise = initailThumbnail()
		}
		func()
		return () => {
			cleannerFuncPromise.then(clearFunc => {
				clearFunc()
			})
		}
	}, [])
	return (
		<>
			<div
				onClick={() => {
					setCurrentPage(targetPage)
				}}
				id={`pageContainer-${targetPage}`}
				ref={containerRef}
				className={`pdfViewer singlePageView  cursor-pointer  border-gray-400  border-2 hover:shadow-md relative w-5/6  aspect-[7/10]  bg-white rounded-2xl  place-self-center overflow-hidden ${currentPage === targetPage ? 'border-red-200' : ''}`}>
				<div id='viewer' className='absolute'></div>
			</div>
		</>
	)
}

export default PdfThumbnail
