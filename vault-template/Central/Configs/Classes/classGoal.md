---
fields:
- name: Parent
  type: File
  options:
    dvQueryString: dv.pages('"Central/Personal/Targets"').where(p => p.Class === 'classGoal')
  path: ''
  id: Hygrpq
- name: Horizon
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': annual
      '2': monthly
      '3': sprint
  path: ''
  id: 9Y8WXK
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
  id: MMYZDK
- name: Priority
  type: Select
  options:
    sourceType: ValuesList
    valuesList:
      '1': '5'
      '2': '4'
      '3': '3'
      '4': '2'
      '5': '1'
  path: ''
  id: golPri
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
  id: hk0SeZ
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
  id: 0fHple
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
- Hygrpq
- 9Y8WXK
- MMYZDK
- golPri
- hk0SeZ
- E84bkH
- 0jsVo2
- unt001
- fSgdQY
- 0fHple
---
