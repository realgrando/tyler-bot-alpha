---
fields:
- name: Parent
  type: File
  options:
    dvQueryString: dv.pages('"Central/Personal/Targets"').where(p => p.Class === 'classGoal')
  path: ''
  id: mtrPar
- name: Metric_Type
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': lag
      '2': lead
  path: ''
  id: mtrTyp
- name: Cadence
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': annual
      '2': monthly
      '3': sprint
  path: ''
  id: mtrCad
- name: Pillar
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': Professional
      '2': Personal
      '3': Intellectual
      '4': Health
      '5': Spiritual
  path: ''
  id: mtrPil
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
- name: Deadline
  type: Date
  options:
    dateFormat: DD-MM-YYYY
  path: ''
  id: mtrDed
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
- mtrPar
- mtrTyp
- mtrCad
- mtrPil
- E84bkH
- 0jsVo2
- unt001
- fSgdQY
- mtrDed
---
