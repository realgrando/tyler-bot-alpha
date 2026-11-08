---
fields:
- name: Parent
  type: File
  options:
    dvQueryString: dv.pages('"Central/Study/Subjects"').where(p => p.Class === 'classSubject')
  path: ''
  id: crsPar
- name: Track
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': polymath
      '2': academic
  path: ''
  id: crsTrk
- name: Author
  type: Input
  options: {}
  path: ''
  id: crsAut
- name: Platform
  type: Input
  options: {}
  path: ''
  id: crsPlt
- name: NotebookLM
  type: Input
  options: {}
  path: ''
  id: crsNlm
- name: Difficulty
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': '1'
      '2': '2'
      '3': '3'
      '4': '4'
      '5': '5'
  path: ''
  id: crsDif
- name: Current
  type: Number
  options:
    defaultValue: '0'
  path: ''
  id: E84bkH
- name: Target
  type: Number
  options:
    defaultValue: '100'
  path: ''
  id: 0jsVo2
- name: Unit
  type: Input
  options: {}
  path: ''
  id: unt001
- name: Progress
  type: Formula
  options:
    autoUpdate: true
    formula: Math.round((current.Current || 0) / (current.Target || 1) * 100)
  path: ''
  id: fSgdQY
- name: Rating
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': '1'
      '2': '2'
      '3': '3'
      '4': '4'
      '5': '5'
  path: ''
  id: crsRat
- name: Canvas
  type: Input
  options: {}
  path: ''
  id: crsCnv
- name: Anki_Deck
  type: Input
  options: {}
  path: ''
  id: crsAnk
version: '4.0'
limit: 20
mapWithTag: false
icon: package
tagNames: null
filesPaths: null
bookmarksGroups: null
excludes: null
extends: classTracked
savedViews: []
favoriteView: null
fieldsOrder:
- crsPar
- crsTrk
- crsAut
- crsPlt
- crsNlm
- crsDif
- E84bkH
- 0jsVo2
- unt001
- fSgdQY
- crsRat
- crsCnv
- crsAnk
---
