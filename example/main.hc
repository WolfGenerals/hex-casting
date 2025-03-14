use "default.toml"
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
iota external1 = <{"hexcasting:type": "hexcasting:pattern", "hexcasting:data": {"angles": [B; 5b, 4b, 5b, 5b, 5b, 5b, 5b], "start_dir": 1b}}>
iota complexList = [vec<0,0,0>,$external1, `aqswde`]

iota Fibonacci =[
    1,
    1,
    2,
    3,
    5,
    8,
    13,
    21,
    34,
    55,
    89,
    144,
    233,
    377,
    610,
    987,
    1597,
    2584,
    4181,
    6765
]

iota deep = [
    [
        [
            [
                [
                    [
                        [
                            [
                                [
                                    [
                                        [
                                            [
                                                [
                                                    [
                                                        [
                                                            [
                                                                [
                                                                   [vec<1,2,3>]
                                                                ]
                                                            ]
                                                        ]
                                                    ]
                                                ]
                                            ]
                                        ]
                                    ]
                                ]
                            ]
                        ]
                    ]
                ]
            ]
        ]
    ]
]
func getBlock{
    get_caster
    entity_pos/eye
    get_caster
    get_entity_look
    raycast
}
func break2Block {
    $getBlock
    break_block
    $getBlock
    break_block
}
func test {
    2131.2E2
    $deep
    $Fibonacci
    &$getBlock //入栈

    // break_block
    <{"hexcasting:type": "hexcasting:pattern", "hexcasting:data": {"angles": [B; 5b, 4b, 5b, 5b, 5b, 5b, 5b], "start_dir": 1b}}>
}
func test2 {
    `wqdsawadq`
    #mask _**_***
}