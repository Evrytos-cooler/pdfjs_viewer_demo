//react
import React, { useEffect, useState, useLayoutEffect, useRef } from 'react'
//pdfjs
import * as pdfjs from 'pdfjs-dist'
import {
	EventBus,
	PDFViewer,
	PDFLinkService,
	PDFFindController,
} from 'pdfjs-dist/web/pdf_viewer.mjs'
import 'pdfjs-dist/web/pdf_viewer.css'

//antd
import {
	LeftCircleOutlined,
	RightCircleOutlined,
	ZoomInOutlined,
	ZoomOutOutlined,
} from '@ant-design/icons'
import type { GetProp } from 'antd'
import { Checkbox, Button, Input, Select } from 'antd'
const { Search } = Input

//type
import type pdfViewerProps from './pdfType'
import PdfThumbnail from './PdfThumbnail'
import { PDFDocumentProxy } from 'pdfjs-dist/types/web/pdf_find_controller'
import usePdfStore from '@/store/pdfStore/usePdfStore'
//至少要有一个query
interface searchParamsType {
	phraseSearch?: boolean
	caseSensitive?: boolean
	findPrevious?: boolean
	highlightAll?: boolean
}

const PdfRender: React.FC<pdfViewerProps> = ({ pdfUrl }) => {
	//pdfjs worker
	// pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.mjs`
	pdfjs.GlobalWorkerOptions.workerSrc =
		'../../../../node_modules/pdfjs-dist/build/pdf.worker.mjs' //本地worker路径
	//Dom Ref
	const containerRef = useRef<HTMLDivElement>(null)
	const viewerRef = useRef<HTMLDivElement>(null)
	//state
	const [scaleValue, setScaleValue] = useState('auto') //用于scale选择
	const { currentPage, setcurrentPage } = usePdfStore(state => ({
		currentPage: state.currentPage,
		setcurrentPage: state.setCurrentPage,
	})) //当前页
	const [totalPage, setTotalPage] = useState(0) //总页数
	const [viewer, setViewer] = useState<PDFViewer>() //pdfViewer实例
	const [pdfProxy, setPdfProxy] = useState<PDFDocumentProxy>()
	const [eventBus, setEventBus] = useState<EventBus>() //pdfEventBus实例
	const [
		searchParams = {
			phraseSearch: true,
			caseSensitive: true,
			findPrevious: true,
			highlightAll: true,
		},
		setSearchParams,
	] = useState<searchParamsType>() //搜索参数

	/**
	 * @description 放大
	 */
	const zoomIn = (): void => {
		if (viewer && containerRef.current?.offsetParent) {
			viewer.currentScale += 0.1
			// setScale(newScale)
			viewer.refresh()
		}
	}
	/**
	 *	@description 缩小
	 */
	const zoomOut = (): void => {
		if (viewer && containerRef.current?.offsetParent) {
			viewer.currentScale -= 0.1
			// setScale(newScale)
			viewer.refresh()
		}
	}
	/**
	 * @description 选择缩放
	 */
	const handleSelectZooming = (value: string): void => {
		setScaleValue(value)
		if (viewer) {
			viewer.currentScaleValue = value
			setScaleValue(value)
			viewer.refresh()
		}
	}
	/**
	 * @description 换页
	 */
	const pageUp = (): void => {
		viewer && (viewer.currentPageNumber += 1)
		setcurrentPage(currentPage + 1)
	}
	const pageDown = (): void => {
		viewer && (viewer.currentPageNumber -= 1)
		setcurrentPage(currentPage - 1)
	}

	/**
	 * @description 滚轮缩放
	 * @description 为什么不能用节流： 节流之后会导致滚动事件的触发频率降低，没有触发的滚动事件的就未执行e.preventDefault,会导致页面缩放
	 */
	const handleWheel = (e: WheelEvent) => {
		if (e.ctrlKey) {
			e.preventDefault()
			if (containerRef.current && viewer) {
				// 获取当前的滚动位置和缩放级别
				const oldScrollTop = containerRef.current.scrollTop
				const oldScrollLeft = containerRef.current.scrollLeft
				const oldZoom = viewer.currentScale

				// 计算光标相对于视口的位置
				const cursorX =
					e.clientX - containerRef.current.getBoundingClientRect().left
				const cursorY =
					e.clientY - containerRef.current.getBoundingClientRect().top

				// 计算光标相对于文档的位置
				const cursorXOnDoc = oldScrollLeft + cursorX
				const cursorYOnDoc = oldScrollTop + cursorY

				const newZoom = e.deltaY < 0 ? oldZoom + 0.05 : oldZoom - 0.05 // 放大或缩小10%
				//限制边界
				if (newZoom < 0.25 || newZoom > 2) return

				// // 设置新的滚动位置
				let newScrollLeft, newScrollTop
				if (newZoom && oldZoom) {
					newScrollLeft = (cursorXOnDoc * newZoom) / oldZoom - cursorX
					newScrollTop = (cursorYOnDoc * newZoom) / oldZoom - cursorY
				}

				containerRef.current.scrollTop = newScrollTop ? newScrollTop : 0
				containerRef.current.scrollLeft = newScrollLeft ? newScrollLeft : 0

				// 设置新的缩放级别
				if (oldZoom && viewer) {
					viewer.currentScale = newZoom
					viewer.refresh()
				}

				// // 计算新的滚动位置，使光标所在位置保持在相同的视口位置
			}
			// if (e.deltaY < 0) {
			// 	zoomIn()
			// } else if (e.deltaY > 0) {
			// 	zoomOut()
			// }
		}
	}

	//实现文字搜素
	const handleSearch = (value: string) => {
		eventBus?.dispatch('find', {
			type: '',
			query: value,
			phraseSearch: searchParams.phraseSearch,
			caseSensitive: searchParams.caseSensitive,
			highlightAll: searchParams.highlightAll,
			findPrevious: searchParams.findPrevious,
		})
		if (viewer?.currentPageNumber) {
			setcurrentPage(viewer.currentPageNumber)
		}
	}

	const handleSearchCheckBoxChange: GetProp<
		typeof Checkbox.Group,
		'onChange'
	> = value => {
		const [phraseSearch, caseSensitive, findPrevious, highlightAll] = value
		setSearchParams({
			phraseSearch: phraseSearch ? true : false,
			caseSensitive: caseSensitive ? true : false,
			highlightAll: highlightAll ? true : false,
			findPrevious: findPrevious ? true : false,
		})
	}

	//TODO  实现空格拖动

	//初始胡PDFViewer
	const initPdfViewer = async (url: string): Promise<() => void> => {
		//实例化 PDFViewer / PDFLinkService / PDFFindController
		if (!containerRef.current)
			return Promise.reject(() => {
				console.log('containerRef is null')
			})
		const eventBus = new EventBus()
		const linkService = new PDFLinkService()
		const findController = new PDFFindController({ linkService, eventBus })
		//两种展示方式
		const pdfViewer = new PDFViewer({
			container: containerRef.current as HTMLDivElement,
			eventBus: eventBus,
			linkService,
			textLayerMode: 1,
			findController,
		})
		linkService.setViewer(pdfViewer)
		//loading pdf
		const pdf = await pdfjs.getDocument(url).promise
		setPdfProxy(pdf)
		const nums = pdf.numPages
		setTotalPage(nums)
		//setDoument之后默认渲染一页
		pdfViewer.setDocument(pdf)
		linkService.setDocument(pdf)

		//监听加载
		const handlePageinit = () => {
			if (pdfViewer) {
				pdfViewer.currentScaleValue = scaleValue
				pdfViewer.currentPageNumber = currentPage
				//将缩放中心设置为盒子(contianer)的中心
				pdfViewer.refresh()
				setViewer(pdfViewer)
				setEventBus(eventBus)
			}
		}
		eventBus.on('pagesinit', handlePageinit)
		//卸载事件
		//refCopy
		const refCopy = containerRef
		console.log('refCopy', refCopy.current)
		return Promise.resolve(() => {
			const page = refCopy.current?.getElementsByClassName('page')
			console.log('inside refCopy', page)

			// for (let i = 0; page && i < page.length; i++) {
			// 	page[i].parentNode?.removeChild(page[i])
			// }
			// return (refCopy: React.MutableRefObject<HTMLDivElement | null>) => {
			//refCopy形成一个闭包
			eventBus.off('pagesinit', handlePageinit)
			// refCopy.current?.querySelectorAll('.page').forEach(pageElement => {
			// 	pageElement.parentNode?.removeChild(pageElement)
			// })
		})
	}

	useLayoutEffect(() => {
		// let cleannerFunc: Promise<
		// 	(refCopy: React.MutableRefObject<HTMLDivElement | null>) => void
		// >
		let cleannerFunc: Promise<() => void> // let refCopy: React.MutableRefObject<HTMLDivElement | null>
		const func = async () => {
			cleannerFunc = initPdfViewer(pdfUrl)
			// refCopy = containerRef
		}
		func()
		return () => {
			const func = async () => {
				cleannerFunc?.then(func => func())
			}
			func()
			// refCopy.current?.querySelectorAll('.page').forEach(pageElement => {
			// 	pageElement.parentNode?.removeChild(pageElement)
			// })
		}
	}, [pdfUrl]) //pdfUrl变化时重新渲染pdf

	useEffect(() => {
		//为viewer窗口绑定滚动事件
		if (viewerRef.current) {
			viewerRef.current.addEventListener('wheel', handleWheel, {
				passive: false,
			})
		}
		if (containerRef.current) {
			containerRef.current.addEventListener('wheel', handleWheel, {
				passive: false,
			})
		}
		const handlePageChange = () => {
			setcurrentPage(viewer?.currentPageNumber as number)
		}
		eventBus?.on('pagechanging', handlePageChange)
		//拖动事件，监听键盘
		// window.addEventListener('keydown', handleKeyDown)
		// window.addEventListener('keyup', handleKeyUp)
		return () => {
			eventBus?.off('pagechanging', handlePageChange)
			// window.removeEventListener('keydown', handleKeyDown)
			// window.removeEventListener('keyup', handleKeyUp)
		}
	})

	//手动从currentPage触发更新
	useEffect(() => {
		if (viewer) {
			viewer.currentPageNumber = currentPage
		}
	}, [currentPage, viewer])

	return (
		<>
			{/* contianer外面的盒子对pdf无影响  */}
			<div className='flex flex-col justify-start h-full w-5/6'>
				{/* viewer */}
				<div className='viewerpart-containner h-full w-full flex-row flex justify-evenly'>
					<div
						id='viewerContainer'
						className=' h-full  w-1/2  relative flex flex-row justify-start'>
						{/* container 的宽度和高度是可视区域的宽高*/}
						<div
							ref={containerRef}
							// className={` pdf-container absolute bg-slate-600 border border-primary rounded-sm h-5/6  aspect-[7/10]  overflow-auto ${setGrabCursor() ? 'cursor-grabbing' : 'cursor-default'}`}
							className={` pdf-container absolute bg-slate-600 border border-primary rounded-sm h-full  aspect-[7/10]  overflow-auto `}>
							<div
								ref={viewerRef}
								id='viewer'
								className={`relative m-auto top-2 left-1 `}></div>
						</div>
					</div>

					{/* thumbnail 列表*/}
					<div className='pdf-thumbnail relative flex flex-col flex-nowrap  space-y-3 w-64 h-full overflow-auto  bg-cyan-50 rounded-2xl'>
						{/* {pdfProxy && (
							<PdfThumbnail
								key={'thumbnail'}
								pageProxy={pdfProxy.getPage(1)}
								targetPage={1}></PdfThumbnail>
						)} */}
						{Array.from({ length: totalPage }).map((_, index) => {
							if (!pdfProxy) {
								return null
							}
							return (
								<PdfThumbnail
									key={'thumbnail' + index}
									pageProxy={pdfProxy.getPage(index + 1)}
									targetPage={index + 1}
								/>
							)
						})}
					</div>
				</div>
				{/* toolBar */}
				<div className='toolBar flex flex-row w-full  bg-cyan-100  '>
					<Button
						onClick={() => {
							zoomIn()
						}}>
						<ZoomInOutlined />
					</Button>
					<Button
						disabled={currentPage === 1}
						onClick={() => {
							pageDown()
						}}>
						<LeftCircleOutlined></LeftCircleOutlined>
					</Button>
					<Select
						className=' w-24'
						defaultValue={scaleValue}
						onChange={handleSelectZooming}
						options={options}></Select>
					<Button
						disabled={currentPage === totalPage}
						onClick={() => {
							pageUp()
						}}>
						<RightCircleOutlined></RightCircleOutlined>
					</Button>
					<Button
						onClick={() => {
							zoomOut()
						}}>
						<ZoomOutOutlined />
					</Button>

					<Search
						style={{ width: 300 }}
						allowClear
						placeholder='tap to find something'
						onSearch={e => {
							handleSearch(e)
						}}></Search>

					<Checkbox.Group
						className=' w-200 flex-row justify-start'
						onChange={handleSearchCheckBoxChange}
						defaultValue={[
							'phraseSearch',
							'caseSensitive',
							'findPrevious',
							'highlightAll',
						]}>
						<Checkbox value='phraseSearch'>phraseSearch</Checkbox>
						<Checkbox value='caseSensitive'>caseSensitive</Checkbox>
						<Checkbox value='findPrevious'>findPrevious</Checkbox>
						<Checkbox value='highlightAll'>highlightAll</Checkbox>
					</Checkbox.Group>
				</div>
			</div>
		</>
	)
}
export default PdfRender
const options = [
	{
		value: 'auto',
		label: 'auto',
	},
	{
		value: 'page-actual',
		label: 'page-actual',
	},
	{
		value: 'page-fit',
		label: 'page-fit',
	},
	{
		value: 'page-width',
		label: 'page-width',
	},
	{
		value: '0.50',
		label: '50%',
	},
	{
		value: '0.75',
		label: '75%',
	},
	{
		value: '1',
		label: '100%',
	},
	{
		value: '1.25',
		label: '125%',
	},
	{
		value: '1.50',
		label: '150%',
	},
	{
		value: '1.75',
		label: '175%',
	},
	{
		value: '2',
		label: '200%',
	},
	{
		value: '3',
		label: '300%',
	},
	{
		value: '4',
		label: '400%',
	},
]
