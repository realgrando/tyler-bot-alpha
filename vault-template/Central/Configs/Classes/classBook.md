---
fields:
- name: Parent
  type: File
  options:
    dvQueryString: dv.pages('"Central/Study/Subjects"').where(p => p.Class === 'classSubject')
  path: ''
  id: wGRvPK
- name: Author
  type: Input
  options: {}
  path: ''
  id: Y4819w
- name: Format
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': physical
      '2': digital
      '3': epub
      '4': pdf
      '5': audible
  path: ''
  id: NjYx6O
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
  id: bkDiff
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
  id: gHdiAY
- name: Cover
  type: Input
  options: {}
  path: ''
  id: 1w9FUR
- name: Canvas
  type: Input
  options: {}
  path: ''
  id: bkCanv
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
- wGRvPK
- Y4819w
- NjYx6O
- bkDiff
- E84bkH
- 0jsVo2
- unt001
- fSgdQY
- gHdiAY
- 1w9FUR
- bkCanv
---
