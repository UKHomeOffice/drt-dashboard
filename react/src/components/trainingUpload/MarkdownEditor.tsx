import React from 'react';
import ReactMarkdown from 'react-markdown';


export const MarkdownEditor = ({markdownContent, handleMarkdownChange}: {
    markdownContent: string,
    handleMarkdownChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
}) => {
    return (
        <div className="page-container">
            <div className="textarea-container">
        <textarea
            value={markdownContent}
            onChange={handleMarkdownChange}
            placeholder="Enter Markdown content"
            style={{height: '300px', width: '300px'}}
        />
            </div>
            <div className="markdown-preview">
                <ReactMarkdown>{markdownContent}</ReactMarkdown>
            </div>
        </div>
    );
};


// export const MarkdownEditor = () => {
//     const [markdownContent, setMarkdownContent] = useState('');
//
//     const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
//         setMarkdownContent(event.target.value);
//     };
//
//     return (
//         <div className="page-container">
//             <div className="textarea-container">
//         <textarea
//             value={markdownContent}
//             onChange={handleInputChange}
//             placeholder="Enter Markdown content"
//             style={{height: '300px' , width : '300px'}}
//         />
//             </div>
//             <div className="markdown-preview">
//                 <ReactMarkdown>{markdownContent}</ReactMarkdown>
//             </div>
//         </div>
//     );
// };
