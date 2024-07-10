import React, { useRef } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Custom blot for handling empty lines
const Block = Quill.import('blots/block');
class EmptyLine extends Block {
  static create(value: any) {
    const node = super.create(value);
    node.setAttribute('data-empty-line', 'true');
    return node;
  }

  static formats(domNode: any) {
    return domNode.getAttribute('data-empty-line');
  }

  format(name: string, value: any) {
    if (name === 'emptyLine' && value) {
      this.domNode.setAttribute('data-empty-line', value);
    } else {
      super.format(name, value);
    }
  }
}

EmptyLine.blotName = 'emptyLine';
EmptyLine.tagName = 'P';

Quill.register(EmptyLine, true);

// Quill editor configuration

const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
    ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
    [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
    [{ 'script': 'sub' }, { 'script': 'super' }],     // superscript/subscript
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],         // outdent/indent
    [{ 'direction': 'rtl' }],                         // text direction
    [{ 'align': [] }],
    ['link', 'image', 'video'],
    ['clean']                                         // remove formatting button
  ],
  clipboard: {
    matchVisual: false,
  }
};
// Allowed formats for the editor
const formats = [
  'header', 'font', 'size', 'bold', 'italic', 'underline', 'strike', 'color', 'background',
  'script', 'list', 'bullet', 'indent', 'direction', 'align', 'link', 'image', 'video', 'emptyLine'
];

interface CustomQuillProps {
  value: string;
  onChange: (content: string) => void;
  readOnly: boolean;
}

// CustomQuill component
const CustomQuill: React.FC<CustomQuillProps> = ({ value, onChange, readOnly }) => {
  const quillRef = useRef<ReactQuill | null>(null);

  const handleChange = (content: string) => {
    onChange(content);
  };

  return (
    <ReactQuill
      ref={quillRef}
      value={value}
      onChange={handleChange}
      readOnly={readOnly}
      modules={modules}
      formats={formats}
      style={{ height: '500px' }} // Adjust the initial height as needed
    />
  );
};

export default CustomQuill;
