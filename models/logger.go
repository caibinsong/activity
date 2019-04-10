package models

import (
	"fmt"
	"os"
	"sync"
)

var oneLogWriter logWriter

const MAX_SIZE int64 = 1024 * 1024 * 10

//获得logwriter
func GetLogWriter() *logWriter {
	return &oneLogWriter
}

//日志记录类
type logWriter struct {
	muxLog   sync.Mutex
	pLogFile *os.File
	fileName string
}

func (l *logWriter) SetLogFile(f string) {
	l.muxLog.Lock()
	defer l.muxLog.Unlock()
	if l.pLogFile != nil {
		l.pLogFile.Close()
		l.pLogFile = nil
	}
	l.fileName = f
	l.pLogFile, _ = os.OpenFile(f, os.O_CREATE|os.O_APPEND|os.O_RDWR, 0777)
}

func (l *logWriter) Write(b []byte) (int, error) {
	l.muxLog.Lock()
	defer l.muxLog.Unlock()
	fmt.Print(string(b))
	if b != nil && l.pLogFile != nil {
		size, err := l.pLogFile.Seek(0, 2)
		if err != nil {
			return 0, err
		}
		if size > MAX_SIZE {
			l.pLogFile.Close()
			os.Rename(l.fileName, l.fileName+".old")
			l.pLogFile, _ = os.OpenFile(l.fileName, os.O_CREATE|os.O_APPEND|os.O_RDWR, 0777)
		}
		//这里写入到文件....
		l.pLogFile.Write(b)
		l.pLogFile.Sync()
	}
	return len(b), nil
}
