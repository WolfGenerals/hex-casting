use ".///dsff"

// ========== Iota定义测试 ==========
iota number1 = 123.45
iota number2 = -0.67e+10
iota number3 = .89E-3
iota boolTrue = true
iota boolFalse = false
iota nullValue = null
iota garbageValue = garbage
iota list1 = [1, [2, [3]], true]
iota vec1 = vec<1.2, -3.4, 5.6e7>
iota pattern1 = `wedsaq`
iota external1 = <minecraft:pig>
iota complexList = [vec<0,0,0>,<west>, `aqswde`]

// ========== 函数定义测试 ==========
func emptyFunc = {
    // =这是一个空函数
}

func basicOperations = {
    #mask _**_***
    &$number1
    $vec1
    42
    false
    <add>
}

func nestedFunctions = {
    [
        $list1,
        vec<1,2,3>
    ]
}

func complexExample = {
    // 混合各种语句
    #mask *__**_
    `wqesad`
    $external1
    &$pattern1
    [
        null,
        vec<.5, .6, .7>
    ]
    <scale:1.5>
}

// ========== 边界情况测试 ==========
iota edge1 = []                // 空列表
iota edge2 = [ null , null , null ]           // 带空元素的列表
iota edge4 = 1234567890.1234567890

// ========== 特殊符号测试 ==========
func specialChars = {
    _test/function
    $weird/identifier
    <characters_here>
}

// ========== 空白处理测试 ==========
iota   spaced   =   [
    1   ,   // 带空格的列表
    vec<   2   ,   3.5   ,   4   >
]
