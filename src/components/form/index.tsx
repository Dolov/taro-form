import Taro from '@tarojs/taro'
import { View } from '@tarojs/components'
import FormItem from './FormItem'
import { ICpForm } from './interface'
import Context from './Context'
import { getValidateFunction } from './validate'
import './style/index.scss'


class CpForm extends Taro.PureComponent<ICpForm> {

	static defaultProps = {
		colon: true,
		layout: 'horizontal',
		fields: [],
		hideRequiredMark: false,
	}

	state = {
		fieldValues: {
			
		},
		fieldErrors: {

		},
	}

	componentDidMount() {
		this.setInitialValues()
	}

	setInitialValues() {
		const { initialValues } = this.props
		this.setFieldsValue(initialValues)
	}

	onChange = (fieldName: string, value: any) => {
		const { fieldValues, fieldErrors } = this.state
		const { onFieldsChange } = this.props
		console.log("onChange:", fieldName,":", value)
		const error = this.validateField(fieldName, value)
		this.setState({
			fieldValues: {
				...fieldValues,
				[fieldName]: value
			},
			fieldErrors: {
				...fieldErrors,
				[fieldName]: error
			}
		}, () => {
			if (typeof onFieldsChange === 'function') {
				const { fieldValues } = this.state
				onFieldsChange(fieldName, fieldValues)
			}
		})
	}

	resetFields = (fieldNames?: string[]) => {
		if (Array.isArray(fieldNames)) {
			const { fieldValues } = this.state
			fieldNames.forEach(field => {
				delete fieldValues[field]
			})
			this.setState({
				fieldValues: {
					...fieldValues,
				}
			})
			return 
		}
		this.setState({
			fieldValues: {},
		})
	}

	setFieldsValue = (fieldsValue, callback?: Function) => {
		if (!fieldsValue || typeof fieldsValue !== 'object') return
		const { fieldValues } = this.state
		this.setState({
			fieldValues: {
				...fieldValues,
				...fieldsValue,
			}
		}, () => {
			if (typeof callback === 'function') {
				callback()
			}
		})
	}

	getFieldValue = (fieldName: string) => {
		const { fieldValues } = this.state
		return fieldValues[fieldName]
	}

	getFieldsValue = (fieldNames: string[]) => {
		const fieldsValue = {}
		if (Array.isArray(fieldNames)) {
			const { fieldValues } = this.state
			fieldNames.forEach(fieldName => {
				if (typeof fieldName !== 'string') return 
				fieldsValue[fieldName] = fieldValues[fieldName]
			})
		}
		return fieldsValue
	}

	getFieldError = (fieldName: string) => {
		const { fieldValues } = this.state
		return this.validateField(fieldName, fieldValues[fieldName])
	}

	getFieldsError = (fieldNames?: string[]) => {
		const fieldErrors = {}
		const { fields } = this.props
		const { fieldValues } = this.state
		const validateFields = Array.isArray(fieldNames) ? fieldNames: fields.map(field => field.fieldCode)
		validateFields.forEach(fieldName => {
			const error = this.validateField(fieldName, fieldValues[fieldName])
			fieldErrors[fieldName] = error
		})
		return fieldErrors
	}

	submit = () => {
		const { fieldValues } = this.state
		return new Promise((resolve, reject) => {
			const fieldErrors = this.validateFields()
			const hasError = Object.keys(fieldErrors).find(fieldName => fieldErrors[fieldName].length)
			if (hasError) {
				reject(fieldErrors)
			} else {
				resolve(fieldValues)
			}
		})
	}

	validateFields = (fieldNames?: string[]) => {
		const fieldErrors = this.getFieldsError(fieldNames)
		this.setState({
			fieldErrors,
		})
		return fieldErrors
	}

	validateField(fieldName: string, fieldValue: any) {
		if (typeof fieldName !== 'string') return 
		const { fields } = this.props
		const field = fields.find(item => item.fieldCode === fieldName)
		if (!field) return
		const { rules } =  field
		if (!Array.isArray(rules)) return
		const errors: string[] = []
		rules.forEach(rule => {
			const validateFunction = getValidateFunction(rule)
			if (typeof validateFunction !== 'function') return 
			const isError = validateFunction(fieldValue, rule)
			if (!isError) return 
			if (rule && rule.message) {
				errors.push(rule.message)
			}
		})
		return errors
	}

	render() {
		const { fields, layout, colon, hideRequiredMark } = this.props
		const { fieldValues, fieldErrors } = this.state
		return (
			<View className="cp-form">
				{fields.map(field => {
					if (!field) return null
					const { fieldCode } = field
					const value = fieldValues[fieldCode]
					const error = fieldErrors[fieldCode]
					return (
						<FormItem 
							key={fieldCode} 
							colon={colon}
							field={field} 
							value={value}
							error={error}
							layout={layout}
							onChange={this.onChange}
							hideRequiredMark={hideRequiredMark}
						/>
					)})}
			</View>
		)
	}
}


export default CpForm
