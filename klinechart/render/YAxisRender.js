import AxisRender from './AxisRender'
import { formatValue } from '../internal/utils/dataUtils'
import { LineStyle, YAxisPosition, YAxisTextPosition, IndicatorType } from '../internal/constants'
import { formatBigNumber } from '../internal/utils/numberUtils'
import { getFont } from '../internal/utils/drawUtils'

class YAxisRender extends AxisRender {
  /**
   * 绘制边框线
   * @param ctx
   * @param yAxis
   * @param display
   */
  renderStrokeLine (ctx, yAxis, display) {
    if (!display) {
      return
    }
    ctx.strokeStyle = yAxis.line.color
    ctx.lineWidth = yAxis.line.size
    let x = this.viewPortHandler.contentLeft()
    if (yAxis.position === YAxisPosition.LEFT) {
      x = this.viewPortHandler.contentRight()
    }
    ctx.beginPath()
    ctx.moveTo(x, this.viewPortHandler.contentTop())
    ctx.lineTo(x, this.viewPortHandler.contentBottom())
    ctx.stroke()
    ctx.closePath()
  }

  /**
   * 绘制轴线
   * @param ctx
   * @param yAxis
   */
  renderAxisLine (ctx, yAxis) {
    if (!yAxis.display || !yAxis.line.display) {
      return
    }
    ctx.strokeStyle = yAxis.line.color
    ctx.lineWidth = yAxis.line.size
    ctx.beginPath()
    if (yAxis.position === YAxisPosition.LEFT) {
      ctx.moveTo(this.viewPortHandler.contentLeft(), this.viewPortHandler.contentTop())
      ctx.lineTo(this.viewPortHandler.contentLeft(), this.viewPortHandler.contentBottom())
    } else {
      ctx.moveTo(this.viewPortHandler.contentRight(), this.viewPortHandler.contentTop())
      ctx.lineTo(this.viewPortHandler.contentRight(), this.viewPortHandler.contentBottom())
    }
    ctx.stroke()
    ctx.closePath()
  }

  /**
   * 绘制y轴上文字
   * @param ctx
   * @param yAxis
   */
  renderAxisLabels (ctx, yAxis) {
    const tickText = yAxis.tick.text
    if (!yAxis.display || !tickText.display) {
      return
    }
    const tickLine = yAxis.tick.line
    const tickTextPosition = tickText.position
    const tickLineDisplay = tickLine.display
    const tickLineLength = tickLine.length
    const tickTextMargin = tickText.margin
    let initX
    if (yAxis.position === YAxisPosition.LEFT) {
      if (tickTextPosition === YAxisTextPosition.OUTSIDE) {
        if (tickLineDisplay) {
          initX = this.viewPortHandler.contentLeft() - tickLineLength - tickTextMargin
        } else {
          initX = this.viewPortHandler.contentLeft() - tickTextMargin
        }
      } else {
        if (tickLineDisplay) {
          initX = this.viewPortHandler.contentLeft() + tickLineLength + tickTextMargin
        } else {
          initX = this.viewPortHandler.contentLeft() + tickTextMargin
        }
      }
    } else {
      if (tickTextPosition === YAxisTextPosition.OUTSIDE) {
        if (tickLineDisplay) {
          initX = this.viewPortHandler.contentRight() + tickLineLength + tickTextMargin
        } else {
          initX = this.viewPortHandler.contentRight() + tickTextMargin
        }
      } else {
        if (tickLineDisplay) {
          initX = this.viewPortHandler.contentRight() - tickLineLength - tickTextMargin
        } else {
          initX = this.viewPortHandler.contentRight() - tickTextMargin
        }
      }
    }
    const textSize = tickText.size
    ctx.textBaseline = 'middle'
    ctx.font = getFont(textSize)
    ctx.fillStyle = tickText.color

    for (let i = 0; i < this.values.length; i++) {
      const labelY = this.getY(this.values[i])
      const text = formatBigNumber(this.values[i])
      if (this.checkShowLabel(labelY, textSize)) {
        if ((yAxis.position === YAxisPosition.LEFT && tickTextPosition === YAxisTextPosition.OUTSIDE) ||
          (yAxis.position === YAxisPosition.RIGHT && tickTextPosition !== YAxisTextPosition.OUTSIDE)) {
          ctx.textAlign = 'right'
        } else {
          ctx.textAlign = 'left'
        }
        ctx.fillText(text, initX, labelY)
      }
    }
    ctx.textAlign = 'left'
  }

  /**
   * 绘制y轴分割线
   * @param ctx
   * @param yAxis
   */
  renderSeparatorLines (ctx, yAxis) {
    const separatorLine = yAxis.separatorLine
    if (!yAxis.display || !separatorLine.display) {
      return
    }
    ctx.strokeStyle = separatorLine.color
    ctx.lineWidth = separatorLine.size

    const labelHeight = yAxis.tick.text.size
    if (separatorLine.style === LineStyle.DASH) {
      ctx.setLineDash(separatorLine.dashValue)
    }

    for (let i = 0; i < this.values.length; i++) {
      const y = this.getY(this.values[i])
      if (this.checkShowLabel(y, labelHeight)) {
        ctx.beginPath()
        ctx.moveTo(this.viewPortHandler.contentLeft(), y)
        ctx.lineTo(this.viewPortHandler.contentRight(), y)
        ctx.stroke()
        ctx.closePath()
      }
    }
    ctx.setLineDash([])
  }

  /**
   * 绘制刻度线
   * @param ctx
   * @param yAxis
   */
  renderTickLines (ctx, yAxis) {
    const tickText = yAxis.tick.text
    if (!yAxis.display || !tickText.display) {
      return
    }
    const tickLine = yAxis.tick.line
    ctx.lineWidth = tickLine.size
    ctx.strokeStyle = tickLine.color

    const labelHeight = tickText.size

    const tickLineLength = tickLine.length

    let startX
    let endX
    const tickTextPosition = tickText.position
    if (yAxis.position === YAxisPosition.LEFT) {
      startX = this.viewPortHandler.contentLeft()
      if (tickTextPosition === YAxisTextPosition.OUTSIDE) {
        endX = startX - tickLineLength
      } else {
        endX = startX + tickLineLength
      }
    } else {
      startX = this.viewPortHandler.contentRight()
      if (tickTextPosition === YAxisTextPosition.OUTSIDE) {
        endX = startX + tickLineLength
      } else {
        endX = startX - tickLineLength
      }
    }
    for (let i = 0; i < this.values.length; i++) {
      const y = this.getY(this.values[i])
      if (this.checkShowLabel(y, labelHeight)) {
        ctx.beginPath()
        ctx.moveTo(startX, y)
        ctx.lineTo(endX, y)
        ctx.stroke()
        ctx.closePath()
      }
    }
  }

  /**
   * 检查是否需要真正显示label及tick线 分割线
   * @param y
   * @param labelHeight
   */
  checkShowLabel (y, labelHeight) {
    return y > this.viewPortHandler.contentTop() + labelHeight && y < this.viewPortHandler.contentBottom() - labelHeight
  }

  calcAxisMinMax (indicatorType, isMainChart = false, isRealTimeChart = false, isShowAverageLine = false) {
    const dataList = this.dataProvider.dataList
    const min = this.dataProvider.minPos
    const max = Math.min(min + this.dataProvider.range, dataList.length)
    const minMaxArray = [Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER]
    if (isRealTimeChart) {
      for (let i = min; i < max; i++) {
        const kLineData = dataList[i]
        const minCompareArray = [kLineData.close, minMaxArray[0]]
        const maxCompareArray = [kLineData.close, minMaxArray[1]]
        if (isShowAverageLine) {
          minCompareArray.push(kLineData.average)
          maxCompareArray.push(kLineData.average)
        }
        minMaxArray[0] = Math.min.apply(null, minCompareArray)
        minMaxArray[1] = Math.max.apply(null, maxCompareArray)
      }
    } else {
      for (let i = min; i < max; i++) {
        const kLineData = dataList[i]
        this.compareMinMax(kLineData, indicatorType, minMaxArray)
        if (isMainChart) {
          minMaxArray[0] = Math.min(kLineData.low, minMaxArray[0])
          minMaxArray[1] = Math.max(kLineData.high, minMaxArray[1])
        }
      }
    }

    if (minMaxArray[0] !== Number.MAX_SAFE_INTEGER && minMaxArray[1] !== Number.MIN_SAFE_INTEGER) {
      this.axisMinimum = minMaxArray[0]
      this.axisMaximum = minMaxArray[1]
    }
  }

  compareMinMax (kLineData, indicatorType, minMaxArray) {
    const indicatorData = formatValue(kLineData, indicatorType.toLowerCase(), {})
    Object.keys(indicatorData).forEach(key => {
      const value = indicatorData[key]
      if (value || value === 0) {
        minMaxArray[0] = Math.min(minMaxArray[0], value)
        minMaxArray[1] = Math.max(minMaxArray[1], value)
      }
    })
    if (indicatorType === IndicatorType.BOLL || indicatorType === IndicatorType.SAR) {
      minMaxArray[0] = Math.min(minMaxArray[0], kLineData.low)
      minMaxArray[1] = Math.max(minMaxArray[1], kLineData.high)
    }
    return minMaxArray
  }

  computeAxis () {
    let min = this.axisMinimum
    let max = this.axisMaximum
    if (min === Number.MAX_SAFE_INTEGER || max === Number.MIN_SAFE_INTEGER || (max === 0 && min === 0)) {
      return
    }

    let range = Math.abs(max - min)
    if (range === 0) {
      max += 1
      min -= 1
      range = Math.abs(max - min)
    }
    this.axisMinimum = min - (range / 100.0) * 10.0
    this.axisMaximum = max + (range / 100.0) * 20.0

    this.axisRange = Math.abs(this.axisMaximum - this.axisMinimum)

    this.computeAxisValues(this.axisMinimum, this.axisMaximum)
  }

  getY (value) {
    return (1.0 - (value - this.axisMinimum) / this.axisRange) * (this.viewPortHandler.contentBottom() - this.viewPortHandler.contentTop())
  }

  getValue (y) {
    return (1.0 - y / (this.viewPortHandler.contentBottom() - this.viewPortHandler.contentTop())) * this.axisRange + this.axisMinimum
  }
}

export default YAxisRender
