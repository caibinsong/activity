package models

import (
	"database/sql"
	"fmt"
	_ "gosql/sqlite3"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"
)

var DbOb DBObject
var smpdb string = "./activity.db"

type DBObject struct {
	dbCache *sql.DB
}

func (this *DBObject) GetDbCache() *sql.DB {
	return this.dbCache
}

func (this *DBObject) InitDbCache() error {
	sqldb, err := sql.Open("sqlite3", smpdb)
	if err != nil {
		return fmt.Errorf("打开数据库失败：%s", err.Error())
	}
	this.dbCache = sqldb
	err = this.createTable()
	return err
}

//建表
func (this *DBObject) createTable() error {
	log.Println("create table start")
	err := filepath.Walk("./table", func(path string, info os.FileInfo, err error) error {
		if !info.IsDir() && strings.HasSuffix(info.Name(), ".sql") {
			log.Println("do sql :", info.Name())
			file_byte, err := ioutil.ReadFile(path)
			if err != nil {
				log.Println(path, err.Error())
				return err
			}
			_, err = this.dbCache.Exec(string(file_byte))
			if err != nil {
				log.Println(string(file_byte), err.Error())
				return err
			}
		}
		return nil
	})
	if err != nil {
		log.Println(err.Error())
	}
	log.Println("create table end ")
	this.dataInit()
	return err
}
//如果查询出来不存在则insert
func (this *DBObject) dataInit() {
	this.NotFindDoExec("select count(*) as num from introduce where introducename='益启之家简介'",
		"insert into introduce(introducename,title,content) values('益启之家简介','','')")
	this.NotFindDoExec("select count(*) as num from introduce where introducename='火速简介'",
		"insert into introduce(introducename,title,content) values('火速简介','','')")
}

func (this *DBObject) NotFindDoExec(query, exec string) {
	d, err := this.Query(query)
	if err != nil {
		log.Panic(err.Error())
	}
	if d[0]["num"] != "1" {
		err= this.Exec(exec)
		if err != nil {
			log.Panic(err.Error())
		}
	}
}

func (this *DBObject) Exec(sql string) error {
	_, err := this.dbCache.Exec(sql)
	if err != nil {
		log.Println(sql, err.Error())
	}
	return err
}

/*
全部转成maplist
*/
//数据库查询rows转换成maplist类型
func (this *DBObject) RecordSetToMapList(rows *sql.Rows) ([]map[string]string, error) {
	var maplist []map[string]string = make([]map[string]string, 0)
	cols, err := rows.Columns()
	if err != nil {
		return nil, err
	}
	colsize := len(cols)
	index := 0
	for rows.Next() {
		index++
		values := make([]sql.NullString, colsize)
		scanArgs := make([]interface{}, colsize)
		for i := 0; i < colsize; i++ {
			scanArgs[i] = &values[i]
		}
		err = rows.Scan(scanArgs...)
		oneMap := make(map[string]string)
		for k, v := range values {
			oneMap[cols[k]] = v.String
		}
		oneMap["xhid"] = fmt.Sprint(index)
		maplist = append(maplist, oneMap)
	}
	return maplist, nil
}

//方便查询，目前返回[]map[string]string内容
func (this *DBObject) Query(sql string) ([]map[string]string, error) {
	recoreset, err := this.dbCache.Query(sql)
	if err != nil {
		log.Println(sql, err.Error())
		return nil, err
	}
	result, _ := this.RecordSetToMapList(recoreset)
	return result, err
}

func (this *DBObject) QueryTableList(query string, pageindex int, pagesize int) (map[string]interface{}, error) {
	if pagesize <= 0 {
		pagesize = 10
	}
	if pageindex <= 0 {
		pageindex = 1
	}
	totalCount := 0

	table_map := make(map[string]interface{})
	table_data := make([]map[string]interface{}, 0)
	rows, err := this.dbCache.Query(query)
	if err != nil {
		return table_map, err
	}
	fields, err := rows.Columns()
	if err != nil {
		return table_map, err
	}
	fields_size := len(fields)
	//移到开始位置
	for totalCount < (pageindex-1)*pagesize && rows.Next() {
		totalCount++
	}
	hxindex := (pageindex - 1) * pagesize
	//取值
	for rows.Next() {
		addmap := make(map[string]interface{})
		hxindex++
		totalCount++
		if len(table_data) >= pagesize {
			break
		}
		values := make([]sql.NullString, fields_size)
		scanArgs := make([]interface{}, fields_size)
		for i := 0; i < fields_size; i++ {
			scanArgs[i] = &values[i]
		}
		err = rows.Scan(scanArgs...)
		dataMap, err := this.rowToMap(values, fields)
		if err != nil {
			return table_map, err
		}
		dataMap["xhid"] = fmt.Sprint(hxindex)
		addmap["id"] = fmt.Sprint(hxindex)
		addmap["cell"] = dataMap
		table_data = append(table_data, addmap)
	}
	for rows.Next() {
		totalCount++
	}
	totalPage := 0
	if totalCount%pagesize == 0 {
		totalPage = totalCount / pagesize
	} else {
		totalPage = totalCount/pagesize + 1
	}
	table_map["pageIndex"] = pageindex
	table_map["totalCount"] = totalCount
	table_map["pageSize"] = pagesize
	table_map["totalPage"] = totalPage
	table_map["data"] = table_data
	return table_map, nil
}

//查询结果集row 的[]string转成map

func (this *DBObject) rowToMap(rows []sql.NullString, fields []string) (map[string]string, error) {
	rstMap := make(map[string]string)
	if len(rows) != len(fields) {
		return rstMap, fmt.Errorf("数据库查询结果集：rows与fields的数量不相等")
	}
	for k, v := range rows {
		rstMap[fields[k]] = v.String
	}
	return rstMap, nil
}
