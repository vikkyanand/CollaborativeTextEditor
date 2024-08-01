import React, { useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import ReactQuill, { Quill, Range, UnprivilegedEditor } from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import './CustomQuill.css';

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

// Custom module for handling enter key
class CustomModule {
  quill: any;
  options: any;

  constructor(quill: any, options: any) {
    this.quill = quill;
    this.options = options;
    this.quill.keyboard.addBinding({ key: Quill.import('modules/keyboard').keys.ENTER }, this.enterHandler.bind(this));
  }

  enterHandler(range: Range | null, context: any) {
    if (!range) return true;
    const lastChar = this.quill.getText(range.index - 1, 1);
    const isAtLineEnd = lastChar === '\n' || range.index === this.quill.getLength() - 1;
    if (isAtLineEnd) {
      this.quill.insertEmbed(range.index, 'emptyLine', true);
      this.quill.setSelection(range.index + 1, 0);
      return false;
    }
    return true;
  }
}

Quill.register('modules/customModule', CustomModule);

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],
    [{ font: [] }],
    [{ size: ['small', false, 'large', 'huge'] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ script: 'sub' }, { script: 'super' }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ indent: '-1' }, { indent: '+1' }],
    [{ direction: 'rtl' }],
    [{ align: [] }],
    ['link', 'image', 'video'],
    ['clean']
  ],
  clipboard: {
    matchVisual: false,
  },
  customModule: true,
  keyboard: {
    bindings: {
      enter: {
        key: Quill.import('modules/keyboard').keys.ENTER,
        handler: function () { return true; }
      }
    }
  }
};

const formats = [
  'header', 'font', 'size', 'bold', 'italic', 'underline', 'strike', 'color', 'background',
  'script', 'list', 'bullet', 'indent', 'direction', 'align', 'link', 'image', 'video', 'emptyLine'
];

interface CustomQuillProps {
  value: string;
  onChange: (content: string) => void;
  readOnly: boolean;
  onCursorPositionChange: (range: { index: number, length: number } | null) => void;
  cursorPositions: { email: string, index: number, length: number }[];
  isEditorFocused: boolean;
  setIsEditorFocused: (focused: boolean) => void;
}

const CustomQuill = forwardRef<ReactQuill, CustomQuillProps>(({
  value,
  onChange,
  readOnly,
  onCursorPositionChange,
  cursorPositions,
  isEditorFocused,
  setIsEditorFocused
}, ref) => {
  const quillRef = useRef<ReactQuill>(null);
  const cursorOverlaysRef = useRef<{ [email: string]: { overlay: HTMLDivElement, marker: HTMLDivElement, timer?: NodeJS.Timeout } }>({});
  const isLocalChange = useRef(false);
  const latestContentRef = useRef(value);

  useImperativeHandle(ref, () => quillRef.current as ReactQuill);

  const handleChange = useCallback((content: string, _delta: any, _source: string, editor: UnprivilegedEditor) => {
    if (!isLocalChange.current) {
      isLocalChange.current = true;
      latestContentRef.current = content;
      onChange(content);
      isLocalChange.current = false;
    }
  }, [onChange]);

  const handleSelectionChange = useCallback((range: Range | null, _source: string, _editor: UnprivilegedEditor) => {
    if (isEditorFocused && range) {
      onCursorPositionChange({ index: range.index, length: range.length });
    } else {
      onCursorPositionChange(null);
    }
  }, [isEditorFocused, onCursorPositionChange]);

  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const handleFocus = () => setIsEditorFocused(true);
    const handleBlur = () => setIsEditorFocused(false);

    quill.root.addEventListener('focus', handleFocus);
    quill.root.addEventListener('blur', handleBlur);

    return () => {
      quill.root.removeEventListener('focus', handleFocus);
      quill.root.removeEventListener('blur', handleBlur);
    };
  }, [setIsEditorFocused]);

  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill) return;

    const updateCursorOverlays = () => {
      cursorPositions.forEach(({ email, index, length }) => {
        if (email === quill.root.getAttribute('data-user-email')) return;

        let cursorElements = cursorOverlaysRef.current[email];
        if (!cursorElements) {
          const overlay = document.createElement('div');
          overlay.className = 'cursor-overlay';
          quill.root.parentNode?.appendChild(overlay);

          const marker = document.createElement('div');
          marker.className = 'cursor-marker';
          quill.root.parentNode?.appendChild(marker);

          cursorOverlaysRef.current[email] = { overlay, marker };
          cursorElements = cursorOverlaysRef.current[email];
        }

        const bounds = quill.getBounds(index, length);
        cursorElements.overlay.style.left = `${bounds.left}px`;
        cursorElements.overlay.style.top = `${bounds.top}px`;
        cursorElements.overlay.textContent = email;
        cursorElements.overlay.style.transform = `translateY(-${bounds.height + 5}px)`;
        cursorElements.overlay.classList.add('show');

        cursorElements.marker.style.left = `${bounds.left}px`;
        cursorElements.marker.style.top = `${bounds.top}px`;
        cursorElements.marker.style.height = `${bounds.height}px`;

        if (cursorElements.timer) {
          clearTimeout(cursorElements.timer);
        }

        cursorElements.timer = setTimeout(() => {
          cursorElements.overlay.classList.remove('show');
        }, 2000);
      });
    };

    updateCursorOverlays();
    quill.on('text-change', updateCursorOverlays);

    return () => {
      quill.off('text-change', updateCursorOverlays);
      Object.values(cursorOverlaysRef.current).forEach(({ overlay, marker, timer }) => {
        overlay.remove();
        marker.remove();
        if (timer) {
          clearTimeout(timer);
        }
      });
      cursorOverlaysRef.current = {};
    };
  }, [cursorPositions]);

  useEffect(() => {
    const quill = quillRef.current?.getEditor();
    if (!quill || isLocalChange.current) return;

    const currentContent = quill.root.innerHTML;
    if (currentContent !== value) {
      const selection = quill.getSelection();
      quill.setContents(quill.clipboard.convert(value));
      if (selection) {
        quill.setSelection(selection);
      }
    }
  }, [value]);

  return (
    <ReactQuill
      ref={quillRef}
      value={value}
      onChange={handleChange}
      onChangeSelection={handleSelectionChange}
      readOnly={readOnly}
      modules={modules}
      formats={formats}
      style={{ height: '500px' }}
      preserveWhitespace={true}
    />
  );
});

export default CustomQuill;
