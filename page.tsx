import React, { useState } from 'react'
import { DefaultLayout } from '@/components/Layout'
// import PdfViewer from './component/PdfRender'
import PdfSinglePageRender from './component/PdfSinglePageRender'
import { Button } from 'antd'
import PdfRender from './component/PdfRender'
const PdfViewerPage: React.FC = () => {
	const [isSinglePageViewer, setIsSinglePageViewer] = useState(false)
	return (
		<DefaultLayout>
			<div className='h-full w-full'>
				<Button
					onClick={() => {
						setIsSinglePageViewer(!isSinglePageViewer)
					}}>
					{isSinglePageViewer ? '切换到多页模式' : '切换到单页模式'}
				</Button>
				{isSinglePageViewer && (
					<PdfSinglePageRender
						className='h-screen w-1/2'
						pdfUrl={'/XXX-前端-5年.pdf'}
					/>
				)}
				{!isSinglePageViewer && (
					<PdfRender
						className='h-screen w-1/2'
						pdfUrl={'/XXX-前端-5年.pdf'}></PdfRender>
				)}
			</div>
		</DefaultLayout>
	)
}

export default PdfViewerPage
